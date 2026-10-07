import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';

/**
 * Profile Page
 * Displays user profile information (including a real "Member since" date)
 */
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, dateLocale } = useLanguage();
  const [memberSince, setMemberSince] = useState(null);

  // "Member since": users.created_at from Supabase, with the auth
  // record's created_at as a fallback. Fixes the old hardcoded 'Unknown'
  // that read a never-populated user_metadata.created_at.
  useEffect(() => {
    let alive = true;
    if (!user) {
      setMemberSince(null);
      return undefined;
    }

    const load = async () => {
      const authCreatedAt = user.created_at || null;
      try {
        const profile = await authService.getProfile(user.id);
        if (alive) setMemberSince(profile?.created_at || authCreatedAt);
      } catch {
        if (alive) setMemberSince(authCreatedAt);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  let memberSinceText = t('unknown');
  if (memberSince) {
    try {
      memberSinceText = format(new Date(memberSince), 'dd MMMM yyyy', { locale: dateLocale });
    } catch {
      memberSinceText = t('unknown');
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('profilePleaseSignIn')}</p>
          <a href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
            {t('signIn')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto">
            {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {user.user_metadata?.username || t('anonymous')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
            {user.email}
          </p>
          {user.user_metadata?.is_owner && (
            <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {t('owner')}
            </span>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {user.user_metadata?.is_owner ? t('blogOwner') : t('profileTitle')}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">{t('email')}</span>
              <span className="text-gray-900 dark:text-white break-all text-right">{user.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">{t('username')}</span>
              <span className="text-gray-900 dark:text-white text-right">{user.user_metadata?.username || t('notSet')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">{t('memberSince')}</span>
              <span className="text-gray-900 dark:text-white text-right">{memberSinceText}</span>
            </div>
            {user.user_metadata?.is_owner && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">{t('roleTag')}</span>
                <span className="text-gray-900 dark:text-white">{t('owner')}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              {t('navLogout')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
