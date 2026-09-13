-- ════════════════════════════════════════════════════════════════════
-- KANZIY — MEDIA UPLOADS & COLOUR VARIANTS MIGRATION
-- Run once in Supabase → SQL Editor on an existing Kanziy database.
-- Safe to re-run: every statement skips what already exists.
-- ════════════════════════════════════════════════════════════════════

-- New columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colorVariants" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "videos" TEXT;
ALTER TABLE "SalesPage" ADD COLUMN IF NOT EXISTS "deliveryVideos" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "selectedColor" TEXT;

-- Public storage bucket for product images and videos, with server-enforced
-- type and size limits (200MB max per file).
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'media', 'media', true, 209715200,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
    )
    ON CONFLICT (id) DO UPDATE
      SET public = true,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
