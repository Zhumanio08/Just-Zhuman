import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { postService } from '../../services/postService';

/**
 * PostCreate Component
 * Form for creating a new post — and editing an existing one when
 * routed to /edit/:id (author only, enforced by RLS)
 */
export default function PostCreate() {
  const { user, isOwner, isLoading: authLoading } = useAuth();
  const { mode, accentColor } = useTheme();
  const navigate = useNavigate();
  const { id: editPostId } = useParams();

  const isEditMode = Boolean(editPostId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [postOwnerId, setPostOwnerId] = useState(null);

  // Edit mode: load the existing post into the form
  useEffect(() => {
    if (!editPostId) return undefined;

    let cancelled = false;

    const loadPost = async () => {
      try {
        setLoadingPost(true);
        setError('');
        const post = await postService.getPostById(editPostId);
        if (cancelled) return;
        setTitle(post.title || '');
        setDescription(post.description || '');
        setImageUrl(post.image_url || '');
        setVideoUrl(post.video_url || '');
        setPostOwnerId(post.owner_id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load the post.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPost(false);
        }
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [editPostId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanImage = imageUrl.trim() || null;
      const cleanVideo = videoUrl.trim() || null;

      if (isEditMode) {
        await postService.updatePost(
          editPostId,
          title.trim(),
          description.trim(),
          cleanImage,
          cleanVideo
        );
      } else {
        if (!user) throw new Error('You must be signed in to create a post.');
        await postService.createPost(
          user.id,
          title.trim(),
          description.trim(),
          cleanImage,
          cleanVideo
        );
      }

      navigate('/feed');
    } catch (err) {
      setError(
        err.message ||
          (isEditMode ? 'Failed to update post.' : 'Failed to create post.')
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, imageUrl, videoUrl, isEditMode, editPostId, user, navigate]);

  // --- Conditional returns (all hooks are declared above) ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!isEditMode && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</p>
          <p className="mt-2 text-sm text-gray-500">
            Only the owner can create posts.
          </p>
          <a
            href="/feed"
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to Feed
          </a>
        </div>
      </div>
    );
  }

  if (isEditMode && postOwnerId && user && postOwnerId !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</p>
          <p className="mt-2 text-sm text-gray-500">
            Only the author can edit this post.
          </p>
          <a
            href="/feed"
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to Feed
          </a>
        </div>
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
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${mode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isEditMode
              ? 'Update your post and save the changes'
              : 'Share your thoughts, photos, and videos with your audience'}
          </p>
        </div>

        <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8`}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputBaseClasses}
                placeholder="Enter a compelling title"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputBaseClasses}
                placeholder="Tell your story..."
                rows={6}
                maxLength={5000}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {description.length}/5000 characters
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputBaseClasses}
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add an image to your post (optional)
              </p>
            </div>

            {/* Video URL */}
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Video URL
              </label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={inputBaseClasses}
                placeholder="https://example.com/video.mp4"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add a video to your post (optional)
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-lg text-white font-medium
                           bg-primary hover:bg-primary-dark transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary/50
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? (isEditMode ? 'Saving...' : 'Creating...')
                  : (isEditMode ? 'Save Changes' : 'Create Post')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium
                           text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                           transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
