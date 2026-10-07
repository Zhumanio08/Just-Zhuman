import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { postService } from '../../services/postService';
import { storageService } from '../../services/storageService';

/**
 * PostCreate Component
 * Form for creating a new post — and editing an existing one when
 * routed to /edit/:id (author only, enforced by RLS).
 * Supports uploading photos (≤10 MB) and videos (≤50 MB) from the
 * device to the 'post_media' storage bucket, plus plain URL fallback.
 */
export default function PostCreate() {
  const { user, isOwner, isLoading: authLoading } = useAuth();
  const { mode, accentColor } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id: editPostId } = useParams();

  const isEditMode = Boolean(editPostId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageFile, setImageFile] = useState(null); // { file, preview }
  const [videoFile, setVideoFile] = useState(null); // { file, preview }
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const [postOwnerId, setPostOwnerId] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [originalVideo, setOriginalVideo] = useState(null);

  // Revoke preview object URLs when the picked file changes/unmounts
  useEffect(() => {
    return () => {
      if (imageFile?.preview) URL.revokeObjectURL(imageFile.preview);
    };
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (videoFile?.preview) URL.revokeObjectURL(videoFile.preview);
    };
  }, [videoFile]);

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
        setOriginalImage(post.image_url || null);
        setOriginalVideo(post.video_url || null);
        setPostOwnerId(post.owner_id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t('loadPostFailed'));
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
  }, [editPostId, t]);

  // Pick a photo/video from the device
  const handleFileSelect = useCallback(
    (kind) => (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError('');

      const issue =
        kind === 'video'
          ? storageService.validateVideo(file)
          : storageService.validateImage(file);
      if (issue) {
        setError(t(issue));
        e.target.value = '';
        return;
      }

      const entry = { file, preview: URL.createObjectURL(file) };
      if (kind === 'video') {
        setVideoFile((prev) => {
          if (prev?.preview) URL.revokeObjectURL(prev.preview);
          return entry;
        });
      } else {
        setImageFile((prev) => {
          if (prev?.preview) URL.revokeObjectURL(prev.preview);
          return entry;
        });
      }
      e.target.value = '';
    },
    [t]
  );

  const handleFileRemove = useCallback((kind) => {
    if (kind === 'video') {
      setVideoFile(null);
    } else {
      setImageFile(null);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');

      if (!title.trim()) {
        setError(t('titleRequired'));
        return;
      }
      if (!description.trim()) {
        setError(t('descriptionRequired'));
        return;
      }
      if (!user) {
        setError(t('mustSignedIn'));
        return;
      }

      try {
        setIsSubmitting(true);

        // Upload picked files first, then store the resulting public URLs
        let finalImage = imageUrl.trim() || null;
        let finalVideo = videoUrl.trim() || null;

        if (imageFile?.file) {
          setUploadStatus(t('uploadingFile', { name: imageFile.file.name }));
          finalImage = await storageService.uploadPostMedia(user.id, imageFile.file, 'image');
        }
        if (videoFile?.file) {
          setUploadStatus(t('uploadingFile', { name: videoFile.file.name }));
          finalVideo = await storageService.uploadPostMedia(user.id, videoFile.file, 'video');
        }
        setUploadStatus('');

        if (isEditMode) {
          await postService.updatePost(
            editPostId,
            title.trim(),
            description.trim(),
            finalImage,
            finalVideo
          );
          // Best-effort cleanup of replaced/removed media files
          if (originalImage && originalImage !== finalImage) {
            storageService.removeByUrl(originalImage);
          }
          if (originalVideo && originalVideo !== finalVideo) {
            storageService.removeByUrl(originalVideo);
          }
        } else {
          await postService.createPost(
            user.id,
            title.trim(),
            description.trim(),
            finalImage,
            finalVideo
          );
        }

        navigate('/feed');
      } catch (err) {
        setUploadStatus('');
        setError(
          err.isKey
            ? t(err.message)
            : err.message || (isEditMode ? t('updatePostFailed') : t('createPostFailed'))
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title,
      description,
      imageUrl,
      videoUrl,
      imageFile,
      videoFile,
      isEditMode,
      editPostId,
      originalImage,
      originalVideo,
      user,
      navigate,
      t,
    ]
  );

  // --- Conditional returns (all hooks are declared above) ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">{t('loadingPost')}</p>
        </div>
      </div>
    );
  }

  if (!isEditMode && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('accessDenied')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('onlyOwnerCreate')}</p>
          <a href="/feed" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('backToFeed')}
          </a>
        </div>
      </div>
    );
  }

  if (isEditMode && postOwnerId && user && postOwnerId !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('accessDenied')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('onlyAuthorEdit')}</p>
          <a href="/feed" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('backToFeed')}
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
    <div className={`min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8 ${mode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isEditMode ? t('editPostTitle') : t('createPostTitle')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isEditMode ? t('editSubtitle') : t('createSubtitle')}
          </p>
        </div>

        <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 sm:p-8`}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {uploadStatus && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span>{uploadStatus}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputBaseClasses}
                placeholder={t('titlePh')}
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputBaseClasses}
                placeholder={t('descriptionPh')}
                rows={6}
                maxLength={5000}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('commentChars', { n: description.length })}
              </p>
            </div>

            {/* Photo: upload from device or paste a URL */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('photoFromDevice')}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect('image')}
                    className="hidden"
                  />
                  <span>📷</span>
                  <span>{t('photoFromDevice')}</span>
                </label>

                {imageFile && (
                  <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <img
                      src={imageFile.preview}
                      alt=""
                      className="w-10 h-10 rounded object-cover border border-gray-300 dark:border-gray-600"
                    />
                    <span className="max-w-[140px] truncate">{imageFile.file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove('image')}
                      className="text-red-500 hover:text-red-700"
                    >
                      {t('removeFile')}
                    </button>
                  </span>
                )}
              </div>

              {!imageFile && isEditMode && originalImage && (
                <img
                  src={originalImage}
                  alt=""
                  className="w-full max-h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              )}

              {!imageFile && (
                <>
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={inputBaseClasses}
                    placeholder={t('imageUrlPh')}
                  />
                  <p className="text-xs text-gray-500">{t('imageOptional')}</p>
                </>
              )}
            </div>

            {/* Video: upload from device or paste a URL */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('videoFromDevice')}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleFileSelect('video')}
                    className="hidden"
                  />
                  <span>🎬</span>
                  <span>{t('videoFromDevice')}</span>
                </label>

                {videoFile && (
                  <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="max-w-[180px] truncate">{videoFile.file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove('video')}
                      className="text-red-500 hover:text-red-700"
                    >
                      {t('removeFile')}
                    </button>
                  </span>
                )}
              </div>

              {!videoFile && videoUrl.trim() && (
                <video src={videoUrl} controls className="w-full max-h-48 rounded-lg" />
              )}
              {isEditMode && !videoFile && !videoUrl.trim() && originalVideo && (
                <video src={originalVideo} controls className="w-full max-h-48 rounded-lg" />
              )}

              {!videoFile && (
                <>
                  <input
                    type="url"
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className={inputBaseClasses}
                    placeholder={t('videoUrlPh')}
                  />
                  <p className="text-xs text-gray-500">{t('videoOptional')}</p>
                </>
              )}
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting || Boolean(uploadStatus)}
                className="flex-1 py-2.5 px-4 rounded-lg text-white font-medium
                           bg-primary hover:bg-primary-dark transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary/50
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? isEditMode
                    ? t('saving')
                    : t('creating')
                  : isEditMode
                    ? t('saveChanges')
                    : t('createPostBtn')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium
                           text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                           transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
