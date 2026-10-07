import supabase from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comment Service
 * Handles all comment-related operations (CRUD + nested replies)
 */
class CommentService {
  /**
   * Fetch comments for a post with nested replies
   * @param {string} postId
   * @returns {Promise<Array>} Flat array of comments
   */
  async getComments(postId) {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        users:id,email,username,
        parent_comment_id
      `,
        { count: 'exact' }
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build a map of comment ID -> comment for O(1) lookup
    const commentMap = new Map();
    const rootComments = [];

    (comments || []).forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    (comments || []).forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId, userId, username, text, parentCommentId = null, imageUrl = null) {
    const { data, error } = await supabase.from('comments').insert({
      id: uuidv4(),
      post_id: postId,
      user_id: userId,
      username: username,
      parent_comment_id: parentCommentId,
      text,
      image_url: imageUrl,
    }).select().single();

    if (error) throw error;

    return data;
  }

  /**
   * Update a comment (user only)
   */
  async updateComment(commentId, text, imageUrl = null) {
    const { data, error } = await supabase
      .from('comments')
      .update({
        text,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .select()
      .eq('id', commentId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a comment (user only)
   */
  async deleteComment(commentId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }

  /**
   * Get a comment by ID
   */
  async getCommentById(commentId) {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        users:id,email,username
      `
      )
      .eq('id', commentId)
      .single();

    if (error) throw error;

    return data;
  }
}

export const commentService = new CommentService();
