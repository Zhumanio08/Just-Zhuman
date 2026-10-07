import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import CommentForm from '../Comment/CommentForm';

/**
 * PostCard Component
 * Displays a single post with owner info, media, likes, comments,
 * and (for the author) edit/delete actions
 */
export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const { mode } = useTheme();
  const { t, dateLocale } = useLanguage();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Sync with the post prop when it is refreshed upstream
  useEffect(() => {
    setLiked(post.is_liked || false);
    setLikeCount(post.like_count || 0);
    setCommentCount(post.comment_count || 0);
  }, [post]);

  const countComments = (nodes) =>
    (nodes || []).reduce((total, node) => total + 1 + countComments(node.replies), 0);

  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const data = await commentService.getComments(post.id);
      setComments(data);
      setCommentCount(countComments(data));
      setActionError('');
    } catch (err) {
      setActionError(err.message || t('loadCommentsFailed'));
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleLike = useCallback(async () => {
    if (!user) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    // Optimistic update
    setLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await postService.toggleLike(post.id);
    } catch (err) {
      // Rollback on failure
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setActionError(err.message || t('likeFailed'));
    }
  }, [user, liked, likeCount, post.id]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t('deletePostConfirm'))) return;

    try {
      setIsDeleting(true);
      await postService.deletePost(post.id);
      if (onDeleted) onDeleted(post.id);
    } catch (err) {
      alert(err.message || t('deletePostFailed'));
    } finally {
      setIsDeleting(false);
    }
  }, [post.id, onDeleted]);

  const handleEdit = useCallback(() => {
    navigate(`/edit/${post.id}`);
  }, [navigate, post.id]);
  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      setIsSubmittingComment(true);
      await commentService.addComment(post.id, user.id, commentText.trim());
      setCommentText('');
      await loadComments();
    } catch (err) {
      setActionError(err.message || t('addCommentFailed'));
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentText, user, post.id, loadComments]);

  const handleSaveCommentEdit = useCallback(async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      await commentService.updateComment(commentId, editCommentText.trim());
      setEditingCommentId(null);
      setEditCommentText('');
      await loadComments();
    } catch (err) {
      setActionError(err.message || t('editCommentFailed'));
    }
  }, [editCommentText, loadComments]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!confirm(t('deleteCommentConfirm'))) return;

    try {
      await commentService.deleteComment(commentId);
      await loadComments();
    } catch (err) {
      setActionError(err.message || t('deleteCommentFailed'));
    }
  }, [loadComments]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
    } catch {
      return '';
    }
  };

  const commentsAnchorId = `comments-${post.id}`;
  const canManagePost = !!user && user.id === post.owner_id;
  const ownerName = post.users?.username || t('anonymous');
  // Recursive comment renderer (supports nested replies, edit, delete, reply)
  const renderComment = (node, depth = 0) => {
    const isMine = !!user && user.id === node.user_id;
    const authorName = node.users?.username || t('anonymous');
    const isEditing = editingCommentId === node.id;

    return (
      <div key={node.id} className={depth > 0 ? 'ml-5 border-l-2 border-gray-200 dark:border-gray-700 pl-3' : ''}>
        <div className={`flex items-start gap-3 rounded-lg p-3 ${mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          {/* Avatar */}
          <span className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {authorName.charAt(0).toUpperCase()}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(node.created_at)}</span>
              {node.updated_at && node.updated_at !== node.created_at && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('edited')}</span>
              )}
              {isMine && <span className="text-xs text-primary">{t('youLabel')}</span>}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveCommentEdit(node.id)}
                    className="px-3 py-1 rounded text-xs font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
                  >
                    {t('save')}
                  </button>
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="px-3 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{node.text}</p>

                {node.image_url && (
                  <img src={node.image_url} alt={t('commentImgAlt')} className="mt-2 max-h-48 w-full object-cover rounded-lg" />
                )}

                <div className="flex items-center gap-3 mt-2">
                  {isMine && (
                    <>
                      <button
                        onClick={() => {
                          setEditingCommentId(node.id);
                          setEditCommentText(node.text);
                        }}
                        className="text-xs text-gray-500 hover:text-primary transition-colors"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteComment(node.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        {t('delete')}
                      </button>
                    </>
                  )}
                  {user && (
                    <button
                      onClick={() => setReplyToId(replyToId === node.id ? null : node.id)}
                      className="text-xs text-gray-500 hover:text-primary transition-colors"
                    >
                      {t('reply')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply form */}
        {user && replyToId === node.id && (
          <div className="ml-6 mt-2">
            <CommentForm
              postId={post.id}
              parentId={node.id}
              onAdd={() => {
                setReplyToId(null);
                loadComments();
              }}
            />
          </div>
        )}

        {/* Replies */}
        {node.replies && node.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {node.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };
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

        {/* Author actions (RLS only allows the author to edit/delete) */}
        {canManagePost && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {t('edit')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 rounded text-xs font-medium text-red-600 dark:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? t('deleting') : t('delete')}
            </button>
          </div>
        )}
      </div>

      {/* Post Body */}
      <div className="px-4 py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{post.title}</h2>

        {post.description && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
                {t('videoNotSupported')}
              </video>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={handleLike}
            disabled={!user}
            title={user ? t('likeThisPost') : t('signInToLike')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:cursor-not-allowed
              ${liked ? 'text-primary bg-primary/10' : 'hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <span className="text-base">{liked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          <button
            onClick={() => {
              document.getElementById(commentsAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            💬 {commentCount}
          </button>
        </div>
      </div>
      {/* Comments Section */}
      <div id={commentsAnchorId} className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 scroll-mt-20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('commentsCount', { count: commentCount })}
          </h3>
          {user && (
            <button
              onClick={() => setIsCommenting((prev) => !prev)}
              className="text-xs text-primary hover:underline"
            >
              {t('addComment')}
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {actionError}
          </div>
        )}

        {/* Comment form */}
        {user && isCommenting && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('writeCommentPh')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-3 py-1.5 rounded text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? t('posting') : t('postCommentBtn')}
              </button>
              <button
                type="button"
                onClick={() => setIsCommenting(false)}
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Comment list */}
        <div className="space-y-4">
          {commentsLoading && (
            <div className="flex items-center gap-2 py-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('loadingComments')}</p>
            </div>
          )}

          {!commentsLoading && comments.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('noComments')}
            </p>
          )}

          {!commentsLoading && comments.map((node) => renderComment(node))}
        </div>
      </div>
    </article>
  );
}