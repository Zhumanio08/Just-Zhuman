import React, { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CommentForm from './CommentForm';

/**
 * CommentThread Component
 * Displays a comment thread with nested replies
 */
export default function CommentThread({ comment, postId, onDelete, theme }) {
  const { user } = useAuth();
  const { mode, accentColor } = useTheme();

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      if (onDelete) {
        await onDelete(comment.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete comment.');
    }
  }, [comment.id, onDelete]);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setEditText(comment.text);
  }, [comment.text]);

  const handleSaveEdit = useCallback(async () => {
    if (!editText.trim()) return;

    try {
      if (onDelete) {
        // TODO: Call updateComment API
        setEditing(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to edit comment.');
    }
  }, [editText, onDelete]);

  const renderComment = (comment, depth = 0) => {
    const isOwner = user?.id === comment.user_id;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3' : ''}`}>
        <div className={`flex items-start gap-3 ${mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-3`}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {comment.username?.charAt(0).toUpperCase() || 'A'}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.username || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.created_at)}
              </span>
              {isOwner && (
                <span className="text-xs text-primary">(You)</span>
              )}
            </div>

            {editing ? (
              // Edit mode
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded text-xs font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {comment.text}
                </p>

                {/* Image */}
                {comment.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={comment.image_url}
                      alt="Comment"
                      className="max-h-48 w-full object-cover"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  {user && isOwner && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="text-xs text-gray-500 hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {user && !isOwner && (
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setShowReplyForm((prev) => !prev)}
                    className="text-xs text-gray-500 hover:text-primary transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply form */}
        {user && showReplyForm && (
          <div className="ml-6 mt-2 animate-fadeIn">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onAdd={(newComment) => {
                setShowReplyForm(false);
              }}
            />
          </div>
        )}

        {/* Replies */}
        {hasReplies && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <renderComment key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootComments = comment.replies?.filter((r) => !r.parent_comment_id) || [];
  const commentWithReplies = { ...comment, replies: [] };

  return (
    <div id="comment-thread" className="space-y-4">
      {comment && renderComment(commentWithReplies, 0)}

      <div id="write-reply">
        <CommentForm postId={postId} onAdd={(newComment) => {}} />
      </div>
    </div>
  );
}
