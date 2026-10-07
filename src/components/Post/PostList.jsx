import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        // TODO: Call getPosts API
        // In demo mode, show a few sample posts
        const samplePosts = [
          {
            id: '1',
            title: 'Welcome to Just Zhuman!',
            description: 'This is my first post on the blog. I am excited to share my thoughts, photos, and videos with you all.',
            image_url: null,
            video_url: null,
            created_at: new Date().toISOString(),
            owner_id: 'owner-1',
            users: { username: 'Just Zhuman', id: 'owner-1' },
            like_count: 0,
            comment_count: 0,
          },
          {
            id: '2',
            title: 'My Weekend Trip',
            description: 'Had an amazing time exploring the mountains this weekend. The scenery was breathtaking and the weather was perfect for hiking.',
            image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
            video_url: null,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            owner_id: 'owner-1',
            users: { username: 'Just Zhuman', id: 'owner-1' },
            like_count: 3,
            comment_count: 2,
          },
        ];
        setPosts(samplePosts);
      } catch (err) {
        setError(err.message || 'Failed to fetch posts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
