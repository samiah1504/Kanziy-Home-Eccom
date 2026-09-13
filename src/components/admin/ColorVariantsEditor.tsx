'use client';

// Colour/variant manager: name + optional colour image per variant, with
// add/remove/reorder and direct image upload. Serializes to a hidden input
// as JSON {name, image?}[] for the surrounding server-action form.

import { useRef, useState } from 'react';
import { deleteUpload } from '@/app/admin/media/actions';
import { uploadFile } from './MediaUploader';

export type ColorVariant = { name: string; image?: string };

export default function ColorVariantsEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: ColorVariant[];
}) {
  const [variants, setVariants] = useState<ColorVariant[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadFor = useRef<number>(-1);

  const serialized = JSON.stringify(
    variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), image: v.image }))
  );

  function update(idx: number, patch: Partial<ColorVariant>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function move(idx: number, delta: number) {
    setVariants((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function remove(idx: number) {
    const v = variants[idx];
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    if (v.image) deleteUpload(v.image).catch(() => {});
  }

  async function handleFile(files: FileList | null) {
    const idx = uploadFor.current;
    if (!files || files.length === 0 || idx < 0) return;
    setError(null);
    setBusy(true);
    const result = await uploadFile(files[0], 'image');
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    const old = variants[idx]?.image;
    update(idx, { image: result.url });
    if (old) deleteUpload(old).catch(() => {});
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <label className="label">Available Colours / Variants</label>
      <input type="hidden" name={name} value={serialized} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden data-uploader={name} onChange={(e) => handleFile(e.target.files)} />

      {variants.length > 0 && (
        <ul className="mb-3 space-y-2">
          {variants.map((v, idx) => (
            <li key={idx} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-2">
              {v.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.image} alt={v.name} className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-warmgrey text-[10px] text-gray-400">No image</span>
              )}
              <input
                className="input flex-1 py-1.5 text-sm"
                placeholder="Colour name, e.g. Black"
                value={v.name}
                onChange={(e) => update(idx, { name: e.target.value })}
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    uploadFor.current = idx;
                    fileRef.current?.click();
                  }}
                  className="rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-navy hover:bg-cream disabled:opacity-50"
                >
                  {busy && uploadFor.current === idx ? 'Uploading…' : v.image ? 'Change image' : 'Upload image'}
                </button>
                <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-30">↑</button>
                <button type="button" aria-label="Move down" disabled={idx === variants.length - 1} onClick={() => move(idx, 1)} className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-30">↓</button>
                <button type="button" aria-label="Remove colour" onClick={() => remove(idx)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setVariants((prev) => [...prev, { name: '' }])}
        className="btn-outline py-2 text-xs"
      >
        + Add Colour
      </button>
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">
        Customers will see these colours (with images) on the sales page and pick one when ordering. Leave empty if the product has no colour options.
      </p>
    </div>
  );
}
