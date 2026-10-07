import React, { useState, useCallback, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * PostCard Component
 * Displays a single post with owner info, media, like count, and comment access
 */
export default function PostCard({ post }) {
  const { user, isOwner } = useAuth();
  const { mode, accentColor } = useTheme();

  const [liked, setLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user has liked this post
  useEffect(() => {
    const isUser = user?.id;
    if (isUser && post.id) {
      setLiked(post.is_liked || false);
      setLikeCount(post.like_count || 0);
    }
  }, [user, post]);

  const handleLike = useCallback(async () => {
    if (!user) return;

    try {
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (err) {
      setLiked(liked);
      setLikeCount(likeCount);
    }
  }, [user, liked, likeCount]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setIsDeleting(true);
      // TODO: Call delete post API
      alert('Post deleted (demo mode)');
    } catch (err) {
      alert(err.message || 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsCommenting(true);
      // TODO: Call post comment API
      alert('Comment added (demo mode)');
      setCommentText('');
      setIsCommenting(false);
    } catch (err) {
      alert(err.message || 'Failed to add comment.');
    }
  }, [commentText]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const ownerName = post.users?.username || 'Anonymous';
  const isOwnerPost = isOwner && post.users?.id === user?.id;

  return (
    <article className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200`}>
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {ownerName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{ownerName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(post.created_at)}
            </p>
          </div>
        </div>

        {/* Owner actions */}
        {(isOwner || isOwnerPost) && (
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-gray-500 hover:text-primary transition-colors"
              onClick={() => alert('Edit post (demo mode)')}
              title="Edit post"
            >
              ✏️
            </button>
            <button
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
          {post.title}
        </h2>

        {post.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Media */}
        {(post.image_url || post.video_url) && (
          <div className="mt-4">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="max-h-80 w-full object-cover rounded-lg shadow"
              />
            )}
            {post.video_url && (
              <video
                src={post.video_url}
                controls
                className="max-h-80 w-full rounded-lg shadow"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors
                ${liked ? 'text-primary bg-primary/10' : 'hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="text-base">{liked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
          </span>
          <span className="flex items-center gap-1">
            <a href={`/post/${post.id}#comments`} className="hover:underline">
              💬 {post.comment_count || 0}
            </a>
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments" className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Comments ({post.comment_count || 0})
          </h3>
          {user && (
            <button
              onClick={() => setIsCommenting((prev) => !prev)}
              className="text-xs text-primary hover:underline"
            >
              Add comment
            </button>
          )}
        </div>

        {/* Comment form */}
        {user && isCommenting && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                Post comment
              </button>
              <button
                type="button"
                onClick={() => setIsCommenting(false)}
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Comment list */}
        <div id="comment-list" className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      </div>
    </article>
  );
}
