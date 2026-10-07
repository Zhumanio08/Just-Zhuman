import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * CommentForm Component
 * Form for adding a comment (with nested reply support)
 */
export default function CommentForm({ postId, parentId = null, onAdd }) {
  const { user } = useAuth();
  const { mode, accentColor } = useTheme();

  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <a href="/login" className="text-primary hover:underline">Sign in</a> to join the conversation.
      </div>
    );
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Please write a comment.');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Call addComment API
      // Callback for demo
      if (onAdd) {
        onAdd({
          id: 'comment-' + Date.now(),
          post_id: postId,
          user_id: user.id,
          username: user.user_metadata?.username || 'Anonymous',
          parent_comment_id: parentId,
          text: text.trim(),
          image_url: imageUrl || null,
          created_at: new Date().toISOString(),
        });
      }
      setText('');
      setImageUrl('');
      setIsSubmitting(false);
    } catch (err) {
      setError(err.message || 'Failed to add comment.');
    }
  }, [text, imageUrl, postId, parentId, onAdd, user]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image file (JPEG, PNG, GIF, WebP).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const inputBaseClasses = `w-full px-3 py-2 rounded-lg border
    focus:outline-none focus:ring-2 focus:ring-primary/30
    transition-colors duration-200
    ${mode === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Comment text */}
      <div>
        <label htmlFor="comment-text" className="sr-only">
          Write a comment
        </label>
        <textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className={`${inputBaseClasses} resize-y`}
          rows={3}
          maxLength={5000}
        />
        <p className="mt-1 text-xs text-gray-500">
          {text.length}/5000 characters
        </p>
      </div>

      {/* Image upload */}
      <div className="flex items-center gap-3">
        <label className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <span className="inline-flex items-center gap-1">
            <span className="text-base">🖼️</span>
            Add image
          </span>
        </label>

        {imageUrl && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white
                   bg-primary hover:bg-primary-dark transition-colors
                   focus:outline-none focus:ring-2 focus:ring-primary/50
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
