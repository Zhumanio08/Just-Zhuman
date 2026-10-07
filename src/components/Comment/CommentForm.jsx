import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { commentService } from '../../services/commentService';
import { storageService } from '../../services/storageService';

/**
 * CommentForm Component
 * Form for adding a comment (with nested reply support).
 * Images are uploaded to the 'comment_media' storage bucket from the
 * user's device (no more base64 blobs in the database).
 */
export default function CommentForm({ postId, parentId = null, onAdd }) {
  const { user } = useAuth();
  const { mode, accentColor } = useTheme();
  const { t } = useLanguage();

  const [text, setText] = useState('');
  const [image, setImage] = useState(null); // { file, preview }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Revoke the object URL of a dropped/replaced preview
  useEffect(() => {
    return () => {
      if (image?.preview) URL.revokeObjectURL(image.preview);
    };
  }, [image]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');

      if (!text.trim()) {
        setError(t('commentRequired'));
        return;
      }

      try {
        setIsSubmitting(true);

        let imageUrl = null;
        if (image?.file) {
          imageUrl = await storageService.uploadCommentMedia(user.id, image.file);
        }

        const newComment = await commentService.addComment(
          postId,
          user.id,
          text.trim(),
          parentId,
          imageUrl
        );
        if (onAdd) {
          onAdd(newComment);
        }
        setText('');
        setImage(null);
      } catch (err) {
        // storageService throws Error(key) for validation problems
        setError(err.isKey ? t(err.message) : err.message || t('addCommentFailed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [text, image, postId, parentId, onAdd, user, t]
  );

  const handleImageSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError('');

      const issue = storageService.validateImage(file);
      if (issue) {
        setError(t(issue));
        e.target.value = '';
        return;
      }

      setImage({ file, preview: URL.createObjectURL(file) });
    },
    [t]
  );

  const handleImageRemove = useCallback(() => {
    setImage((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }, []);

  // Signed-out UI — must come AFTER all hooks to keep hook order stable
  if (!user) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <a href="/login" className="text-primary hover:underline">{t('signIn')}</a>{' '}
        {t('joinConversation')}
      </div>
    );
  }

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
          {t('writeCommentPh')}
        </label>
        <textarea
          id="comment-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('writeCommentPh')}
          className={`${inputBaseClasses} resize-y`}
          rows={3}
          maxLength={5000}
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('commentChars', { n: text.length })}
        </p>
      </div>

      {/* Image upload from device */}
      <div className="flex items-center gap-3">
        <label className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          <span className="inline-flex items-center gap-1">
            <span className="text-base">🖼️</span>
            {t('addImage')}
          </span>
        </label>

        {image && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <img src={image.preview} alt={t('commentImgAlt')} className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={handleImageRemove}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              {t('removeFile')}
            </button>
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
        {isSubmitting ? t('posting') : t('postCommentBtn')}
      </button>
    </form>
  );
}
