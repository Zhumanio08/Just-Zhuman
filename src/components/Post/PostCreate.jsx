import React, { useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * PostCreate Component
 * Form for creating a new post (title, description, image, video)
 */
export default function PostCreate() {
  const { isOwner, isLoading: authLoading } = useAuth();
  const { mode, accentColor } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isOwner) {
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
      // TODO: Call createPost API
      alert('Post created successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setImageUrl('');
      setVideoUrl('');
      window.location.href = '/feed';
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, imageUrl, videoUrl]);

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
            Create New Post
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Share your thoughts, photos, and videos with your audience
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
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/feed'}
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
