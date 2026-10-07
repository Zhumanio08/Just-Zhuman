-- ============================================================================
-- 04_policies.sql
-- Row Level Security (RLS) policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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
