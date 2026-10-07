import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PostList from '../components/Post/PostList';

/**
 * Feed Page
 * Main page displaying all posts in a feed
 */
export default function Feed() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

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

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {user
              ? t('feedWelcome', { name: user.user_metadata?.username || 'User' })
              : t('feedTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user ? t('feedSubtitle') : t('feedSignInSub')}
          </p>
        </div>

        <PostList />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-4 px-4">
          {t('feedFooter')}
        </p>
      </footer>
    </div>
  );
}
