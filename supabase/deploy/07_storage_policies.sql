-- ============================================================================
-- 07_storage_policies.sql
-- FIX: replaces the broken storage policies from 05_storage.sql.
--
-- 05_storage.sql had two problems:
--   1) The post_media INSERT policy only allowed uploads for users with
--      ZERO existing posts (NOT EXISTS ... posts) — once you created your
--      first post you could never upload media again.
--   2) There were no DELETE policies, so replacing/removing media files
--      during post edit would always fail.
--
-- Run this file in the Supabase SQL editor AFTER 05_storage.sql.
-- ============================================================================

-- Make sure the buckets exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_media', 'post_media', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('comment_media', 'comment_media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Drop the broken/incorrect policies from 05_storage.sql
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read post media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload comment media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read comment media" ON storage.objects;

-- ----------------------------------------------------------------------------
-- post_media: any signed-in user may upload; only the owner of the folder
-- (first path segment = user id) may delete
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post_media'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post_media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post_media');

-- ----------------------------------------------------------------------------
-- comment_media: same rules
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can upload comment media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comment_media'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own comment media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comment_media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read comment media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comment_media');
