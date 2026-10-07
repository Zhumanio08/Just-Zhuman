import supabase from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Post Service
 * Handles all post-related operations (CRUD + likes)
 */
class PostService {
  /**
   * Fetch all posts, newest first
   * @param {number} [limit=20]
   * @param {number} [offset=0]
   */
  async getPosts(limit = 20, offset = 0) {
    let { data, error } = await supabase
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
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch like counts for each post in batch
    const postsWithLikes = await Promise.all(
      (data || []).map(async (post) => {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        return { ...post, like_count: count || 0 };
      })
    );

    return postsWithLikes;
  }

  /**
   * Fetch a single post by ID with owner info and like count
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

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', data.id);

    return { ...data, like_count: count || 0 };
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
   * Update a post (owner only)
   */
  async updatePost(postId, title, description, imageUrl = null, videoUrl = null) {
    const { data, error } = await supabase.from('posts').update({
      title,
      description,
      image_url: imageUrl,
      video_url: videoUrl,
      updated_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a post (owner only)
   */
  async deletePost(postId) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId, userId, username) {
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;

      return { liked: false, like_count: null };
    } else {
      // Like
      const { data, error } = await supabase.from('likes').insert({
        id: uuidv4(),
        post_id: postId,
        user_id: user.id,
        username: username || user.user_metadata?.username || null,
      }).select().single();

      if (error) throw error;

      return { liked: true, like_count: null };
    }
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
      .single();
    return !!data;
  }
}

export const postService = new PostService();
