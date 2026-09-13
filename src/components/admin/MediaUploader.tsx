'use client';

// Direct-upload media manager for the admin. Files are validated, images are
// downscaled in the browser, then uploaded straight to storage via a signed
// URL from requestUpload(). The resulting URLs are kept in a hidden input as
// JSON, which the surrounding server-action form submits with the rest of
// the fields. Pasting a URL remains available as a fallback.

import { useRef, useState } from 'react';
import { deleteUpload, requestUpload } from '@/app/admin/media/actions';
import { applyWatermark } from './watermark';

export type MediaItem = { url: string; poster?: string };

async function optimizeImage(file: File): Promise<File> {
  // Downscale large photos to max 1600px and re-encode — keeps pages fast.
  if (!/^image\/(jpeg|webp|png)$/.test(file.type) || file.size < 300_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const keepPng = file.type === 'image/png';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    const ext = keepPng ? '.png' : '.jpg';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, {
      type: keepPng ? 'image/png' : 'image/jpeg',
    });
  } catch {
    return file;
  }
}

export async function uploadFile(
  file: File,
  kind: 'image' | 'video',
  watermark = false
): Promise<{ url: string } | { error: string }> {
  let prepared = kind === 'image' ? await optimizeImage(file) : file;
  if (kind === 'image' && watermark) prepared = await applyWatermark(prepared);
  const ticket = await requestUpload({
    filename: prepared.name,
    contentType: prepared.type,
    size: prepared.size,
    kind,
  });
  if ('error' in ticket) return ticket;
  try {
    const res = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': prepared.type },
      body: prepared,
    });
    if (!res.ok) return { error: `Upload failed (${res.status})` };
    return { url: ticket.publicUrl };
  } catch {
    return { error: 'Upload failed — check your connection and try again' };
  }
}

export default function MediaUploader({
  name,
  label,
  kind,
  multiple = true,
  defaultValue,
  withPoster = false,
  mainBadge = false,
  watermark = false,
  hint,
}: {
  name: string; // hidden input name; value is JSON
  label: string;
  kind: 'image' | 'video';
  multiple?: boolean;
  defaultValue: MediaItem[];
  withPoster?: boolean; // videos: allow a poster image per item
  mainBadge?: boolean; // images: first item is the main image
  watermark?: boolean; // stamp the KANZIY wordmark into uploaded photos
  hint?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>(defaultValue);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const posterFor = useRef<number>(-1);

  // Images serialize as plain string[] (the existing DB format);
  // videos as {url, poster?}[].
  const serialized =
    kind === 'image'
      ? JSON.stringify(items.map((i) => i.url))
      : JSON.stringify(items);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}… (${list[i].name})`);
      const result = await uploadFile(list[i], kind, watermark);
      if ('error' in result) {
        setError(result.error);
        break;
      }
      setItems((prev) =>
        multiple ? [...prev, { url: result.url }] : [{ url: result.url }]
      );
    }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handlePosterFile(files: FileList | null) {
    const idx = posterFor.current;
    if (!files || files.length === 0 || idx < 0) return;
    setError(null);
    setBusy('Uploading poster image…');
    const result = await uploadFile(files[0], 'image', watermark);
    setBusy(null);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, poster: result.url } : item))
    );
    if (posterRef.current) posterRef.current.value = '';
  }

  function move(idx: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    const item = items[idx];
    setItems((prev) => prev.filter((_, i) => i !== idx));
    // Best-effort cleanup of files stored in our bucket.
    deleteUpload(item.url).catch(() => {});
    if (item.poster) deleteUpload(item.poster).catch(() => {});
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setItems((prev) => (multiple ? [...prev, { url }] : [{ url }]));
    setUrlDraft('');
  }

  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime';

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={serialized} />

      {items.length > 0 && (
        <ul className="mb-3 space-y-2">
          {items.map((item, idx) => (
            <li key={`${item.url}-${idx}`} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-2">
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-navy text-lg text-white" aria-hidden>▶</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600">{item.url.split('/').pop()}</p>
                {mainBadge && idx === 0 && (
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">Main image</span>
                )}
                {withPoster && kind === 'video' && (
                  <button
                    type="button"
                    className="mt-0.5 text-[11px] font-medium text-navy underline hover:text-gold"
                    onClick={() => {
                      posterFor.current = idx;
                      posterRef.current?.click();
                    }}
                  >
                    {item.poster ? 'Change poster image' : 'Add poster image'}
                  </button>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {mainBadge && idx > 0 && (
                  <button type="button" title="Make main image" onClick={() => setItems((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)])} className="rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-navy hover:bg-cream">
                    Make main
                  </button>
                )}
                <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                <button type="button" aria-label="Move down" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                <button type="button" aria-label="Remove" onClick={() => remove(idx)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
          className="btn-gold py-2 text-xs disabled:opacity-60"
        >
          {busy ? 'Uploading…' : kind === 'image' ? `Upload Image${multiple ? 's' : ''}` : `Upload Video${multiple ? 's' : ''}`}
        </button>
        <input ref={fileRef} type="file" accept={accept} multiple={multiple} hidden data-uploader={name} onChange={(e) => handleFiles(e.target.files)} />
        {withPoster && (
          <input ref={posterRef} type="file" accept="image/jpeg,image/png,image/webp" hidden data-uploader={`${name}-poster`} onChange={(e) => handlePosterFile(e.target.files)} />
        )}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-navy">or paste a URL</summary>
          <div className="mt-2 flex gap-2">
            <input className="input py-1.5 text-xs" placeholder="https://…" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
            <button type="button" onClick={addUrl} className="btn-navy whitespace-nowrap py-1.5 text-xs">Add URL</button>
          </div>
        </details>
      </div>

      {busy && <p className="mt-2 text-xs text-gray-500">{busy}</p>}
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {hint && !busy && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
