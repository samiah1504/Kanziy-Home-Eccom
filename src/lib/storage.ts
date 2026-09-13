// Supabase Storage integration (server-side only).
//
// Uploads never pass through our server: the admin browser asks for a signed
// upload URL (created here with the service-role key) and PUTs the file
// straight to Supabase Storage, so large videos work within Vercel's request
// limits. Files are served from the public `media` bucket; the bucket itself
// enforces allowed mime types and a 200MB size cap (see the migration SQL).

const BUCKET = 'media';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB (images are downscaled client-side first)
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function publicUrlPrefix(): string | null {
  const cfg = storageConfig();
  return cfg ? `${cfg.url}/storage/v1/object/public/${BUCKET}/` : null;
}

function sanitizeFilename(name: string) {
  const base = name.replace(/^.*[\\/]/, '').slice(-80);
  return base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

export function buildObjectPath(filename: string) {
  const now = new Date();
  const folder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${Date.now()}-${rand}-${sanitizeFilename(filename) || 'file'}`;
}

/** Create a one-time signed upload URL; the browser PUTs the file to it. */
export async function createSignedUpload(
  path: string
): Promise<{ uploadUrl: string; publicUrl: string } | { error: string }> {
  const cfg = storageConfig();
  if (!cfg) {
    return {
      error:
        'File storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the environment, or paste a URL instead.',
    };
  }
  try {
    const res = await fetch(
      `${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `Storage error ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as { url?: string };
    if (!data.url) return { error: 'Storage returned no upload URL' };
    return {
      uploadUrl: `${cfg.url}/storage/v1${data.url}`,
      publicUrl: `${cfg.url}/storage/v1/object/public/${BUCKET}/${path}`,
    };
  } catch (err) {
    return { error: `Could not reach storage: ${String(err).slice(0, 200)}` };
  }
}

/** Delete an object by its public URL. Best-effort; external URLs are ignored. */
export async function deleteByPublicUrl(url: string): Promise<void> {
  const cfg = storageConfig();
  const prefix = publicUrlPrefix();
  if (!cfg || !prefix || !url.startsWith(prefix)) return;
  const path = url.slice(prefix.length);
  if (!path || path.includes('..')) return;
  try {
    await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cfg.key}` },
      cache: 'no-store',
    });
  } catch {
    // best-effort — an orphaned file is harmless, a broken page is not
  }
}
