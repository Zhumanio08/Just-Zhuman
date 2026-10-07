-- ============================================================================
-- 05_storage.sql
-- Storage buckets and policies
-- ============================================================================

-- Enable storage extension (if not already enabled)
-- Storage is enabled by default in Supabase projects

-- ============================================================================
-- Storage Buckets
-- ============================================================================

-- Create post_media bucket for post images/videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_media', 'post_media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create comment_media bucket for comment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment_media', 'comment_media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies for post_media bucket
-- ============================================================================

-- Allow authenticated users to upload post media
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post_media' AND
  auth.role() = 'authenticated' AND
  (
    NOT EXISTS (
      SELECT 1 FROM posts
      WHERE owner_id = auth.uid()
    )
  )
);

-- Allow public read access to post media
CREATE POLICY "Public can read post media"
ON storage.objects FOR SELECT
TO public
WITH CHECK (bucket_id = 'post_media');

-- ============================================================================
-- Storage Policies for comment_media bucket
-- ============================================================================

-- Allow authenticated users to upload comment media
CREATE POLICY "Authenticated users can upload comment media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comment_media' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to comment media
CREATE POLICY "Public can read comment media"
ON storage.objects FOR SELECT
TO public
WITH CHECK (bucket_id = 'comment_media');
