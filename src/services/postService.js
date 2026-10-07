import supabase from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Post Service
 * Handles all post-related operations (CRUD + likes)
 */
class PostService {
  /**
   * Fetch all posts, newest first, with like/comment counts and the
   * current user's like status (batched — no N+1 queries)
   * @param {number} [limit=20]
   * @param {number} [offset=0]
   */
  async getPosts(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        users:owner_id (
          id,
          email,
          username,
          is_owner
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const posts = data || [];
    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.id);

    // Batch fetch: all likes + all comments for the visible posts
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    if (likesResult.error) throw likesResult.error;
    if (commentsResult.error) throw commentsResult.error;

    const { data: { user } = {} } = await supabase.auth.getUser();

    const likeCounts = {};
    const likedPostIds = new Set();
    (likesResult.data || []).forEach((like) => {
      likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      if (user && like.user_id === user.id) likedPostIds.add(like.post_id);
    });

    const commentCounts = {};
    (commentsResult.data || []).forEach((comment) => {
      commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
    });

    return posts.map((post) => ({
      ...post,
      like_count: likeCounts[post.id] || 0,
      comment_count: commentCounts[post.id] || 0,
      is_liked: likedPostIds.has(post.id),
    }));
  }

  /**
   * Fetch a single post by ID with owner info, counts, and like status
   */
  async getPostById(postId) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        users:owner_id (
          id,
          email,
          username,
          is_owner
        )
      `
      )
      .eq('id', postId)
      .single();

    if (error) throw error;

    const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', data.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', data.id),
    ]);

    const { data: { user } = {} } = await supabase.auth.getUser();
    let isLiked = false;
    if (user) {
      const { data: myLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', data.id)
        .eq('user_id', user.id)
        .maybeSingle();
      isLiked = !!myLike;
    }

    return {
      ...data,
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      is_liked: isLiked,
    };
  }

  /**
   * Create a new post (owner only)
   */
  async createPost(ownerId, title, description, imageUrl = null, videoUrl = null) {
    const { data, error } = await supabase.from('posts').insert({
      id: uuidv4(),
      owner_id: ownerId,
      title,
      description,
      image_url: imageUrl,
      video_url: videoUrl,
    }).select().single();

    if (error) throw error;

    // Update the created_at timestamp
    await supabase
      .from('posts')
      .update({ created_at: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  }

  /**
   * Update a post (only the author can — enforced by RLS)
   */
  async updatePost(postId, title, description, imageUrl = null, videoUrl = null) {
    const { data, error } = await supabase.from('posts').update({
      title,
      description,
      image_url: imageUrl,
      video_url: videoUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', postId).select().single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a post (only the author can — enforced by RLS)
   */
  async deletePost(postId) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  }

  /**
   * Toggle like on a post for the current user
   * @returns {Promise<{liked: boolean}>}
   */
  async toggleLike(postId) {
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to like posts.');

    const { data: existingLike, error: selectError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;

      return { liked: false };
    }

    // Like
    const { error } = await supabase.from('likes').insert({
      id: uuidv4(),
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;

    return { liked: true };
  }

  /**
   * Get like count for a post
   */
  async getLikeCount(postId) {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    return count || 0;
  }

  /**
   * Check if a post exists and user has liked it
   */
  async checkLike(postId, userId) {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  }
}

export const postService = new PostService();
