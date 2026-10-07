-- ============================================================================
-- Just Zhuman Blog - Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================================

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  is_owner BOOLEAN DEFAULT FALSE,
  theme_preference JSONB DEFAULT '{"mode": "light", "accentColor": "#7c3aed"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- ============================================================================
-- Table: likes
-- ============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for likes table
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

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

-- Configure storage policies for post_media
-- Allow authenticated users to upload posts
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post_media' AND
  auth.role() = 'authenticated' AND

-- ============================================================================
-- users RLS Policies
-- ============================================================================

-- Users can read all user data (for display purposes)
CREATE POLICY "Users can read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- posts RLS Policies
-- ============================================================================

-- Public can read all posts (feed)
CREATE POLICY "Public can read all posts"

-- ============================================================================
-- Views for convenience (optional)
-- ============================================================================

-- View to get comments with nested replies structure
CREATE OR REPLACE VIEW comments_with_replies AS
SELECT
  c.*,
  u.username,
  u.id as user_id,
  CASE
    WHEN c.parent_comment_id IS NULL THEN 0
    ELSE 1
  END as is_reply
FROM comments c
JOIN users u ON c.user_id = u.id;

-- Create index on view for performance
CREATE INDEX IF NOT EXISTS idx_comments_with_replies_post_id ON comments_with_replies(post_id);

-- ============================================================================
-- Functions (Optional - for use in RPC or complex queries)
-- ============================================================================

-- Function to get like count for a post
CREATE OR REPLACE FUNCTION get_post_like_count(post_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM likes
  WHERE post_id = post_uuid;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has liked a post
CREATE OR REPLACE FUNCTION check_post_like(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  exists_likes BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE post_id = post_uuid AND user_id = user_uuid
  ) INTO exists_likes;

  RETURN exists_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all comments for a post with nested replies
CREATE OR REPLACE FUNCTION get_post_comments(post_uuid UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  user_id UUID,
  username VARCHAR,
  parent_comment_id UUID,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.post_id,
    c.user_id,
    u.username,
    c.parent_comment_id,
    c.text,
    c.image_url,
    c.created_at,
    c.updated_at
  FROM comments c
  JOIN users u ON c.user_id = u.id
  WHERE c.post_id = post_uuid
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ON posts FOR SELECT
TO public
USING (true);

-- Owner can create posts
CREATE POLICY "Owner can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Owner can update own posts
CREATE POLICY "Owner can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Owner can delete own posts
CREATE POLICY "Owner can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- ============================================================================
-- likes RLS Policies
-- ============================================================================

-- Users can insert likes
CREATE POLICY "Users can insert likes"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Public can read likes
CREATE POLICY "Public can read likes"
ON likes FOR SELECT
TO public
USING (true);

-- ============================================================================
-- comments RLS Policies
-- ============================================================================

-- Public can read all comments
CREATE POLICY "Public can read all comments"
ON comments FOR SELECT
TO public
USING (true);

-- Users can insert comments
CREATE POLICY "Users can insert comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

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

-- Configure storage policies for comment_media
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

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- Table: comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Update timestamp trigger for comments
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_owner ON users(is_owner);

-- ============================================================================
-- Table: posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Create indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_owner_id ON posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Update timestamp trigger for posts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
