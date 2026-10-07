import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/**
 * Profile Page
 * Displays user profile information
 */
export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Please sign in</p>
          <a href="/login" className="mt-4 text-sm text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto">
            {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {user.user_metadata?.username || 'Anonymous'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
          {user.user_metadata?.is_owner && (
            <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Owner
            </span>
          )}
        </div>

        <div className={`${user.user_metadata?.is_owner ? 'bg-gray-50 dark:bg-gray-800 rounded-xl p-6' : 'bg-gray-50 dark:bg-gray-800 rounded-xl p-6'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {user.user_metadata?.is_owner ? 'Blog Owner' : 'Profile'}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-gray-900 dark:text-white">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Username</span>
              <span className="text-gray-900 dark:text-white">{user.user_metadata?.username || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Member since</span>
              <span className="text-gray-900 dark:text-white">
                {/* In production, fetch from Supabase */}
                {user.user_metadata?.created_at || 'Unknown'}
              </span>
            </div>
            {user.user_metadata?.is_owner && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className="text-gray-900 dark:text-white">Owner</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
