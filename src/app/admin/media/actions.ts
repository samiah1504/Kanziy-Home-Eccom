'use server';

// Media upload server actions — only content managers can obtain upload URLs
// or delete stored files. The actual bytes go browser → Supabase Storage.

import { requireRole } from '@/lib/auth';
import {
  buildObjectPath, createSignedUpload, deleteByPublicUrl,
  IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_TYPES,
} from '@/lib/storage';

export type UploadTicket =
  | { uploadUrl: string; publicUrl: string }
  | { error: string };

export async function requestUpload(params: {
  filename: string;
  contentType: string;
  size: number;
  kind: 'image' | 'video';
}): Promise<UploadTicket> {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');

  const { filename, contentType, size, kind } = params;
  if (typeof filename !== 'string' || typeof contentType !== 'string') {
    return { error: 'Invalid upload request' };
  }
  if (kind === 'image') {
    if (!IMAGE_TYPES.includes(contentType)) {
      return { error: 'Only JPG, PNG, WebP or GIF images are allowed' };
    }
    if (size > MAX_IMAGE_BYTES) {
      return { error: 'Image is too large (max 10MB)' };
    }
  } else if (kind === 'video') {
    if (!VIDEO_TYPES.includes(contentType)) {
      return { error: 'Only MP4, WebM or MOV videos are allowed' };
    }
    if (size > MAX_VIDEO_BYTES) {
      return { error: 'Video is too large (max 200MB)' };
    }
  } else {
    return { error: 'Invalid upload kind' };
  }

  return createSignedUpload(buildObjectPath(filename));
}

/** Remove a stored file (called when admin deletes/replaces media). */
export async function deleteUpload(url: string): Promise<void> {
  await requireRole('SUPER_ADMIN', 'CONTENT_ADMIN');
  if (typeof url === 'string') await deleteByPublicUrl(url);
}
