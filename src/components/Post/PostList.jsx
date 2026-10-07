import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import PostCard from './PostCard';

/**
 * PostList Component
 * Displays all posts (newest first) with empty state
 */
export default function PostList() {
  const { isOwner } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError('');
      const data = await postService.getPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = useCallback(() => {
    // Silent refresh — keep current scroll position, no spinner flash
    fetchPosts(false);
  }, [fetchPosts]);

  const handleCreatePost = useCallback(() => {
    window.location.href = '/create';
  }, []);

  return (
    <div>
      {/* Create Post Button (owner only) */}
      {isOwner && (
        <div className="mb-6">
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium
                       bg-primary hover:bg-primary-dark transition-colors
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="text-lg">+</span>
            Create New Post
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No posts yet. Be the first to create one!
          </p>
        </div>
      )}

      {/* Post Feed */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
