import React, { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Login Component
 * Email/username + password authentication
 */
export default function Login() {
  const { login, isLoading, user } = useAuth();
  const { mode, accentColor } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Allow both email and username
      const identifier = formData.identifier.trim();
      await login(identifier, formData.password);
      // Requirement: after successful login go straight to the feed
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err.message || t('loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, login, navigate, t]);

  const inputBaseClasses = `w-full px-3 py-2 rounded-lg border
    focus:outline-none focus:ring-2 focus:ring-primary/30
    transition-colors duration-200
    ${mode === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  // Already signed in — go to the feed
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8
                    bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('loginTitle')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('loginSubtitle')}
          </p>
        </div>

        <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8`}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier field (email or username) */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('emailOrUsername')}
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                className={inputBaseClasses}
                placeholder={t('emailOrUsernamePh')}
                autoComplete="username"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputBaseClasses}
                placeholder={t('passwordPh')}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium
                         bg-primary hover:bg-primary-dark transition-colors
                         focus:outline-none focus:ring-2 focus:ring-primary/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('signingIn') : t('signInBtn')}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('noAccount')}{' '}
            <a
              href="/signup"
              className="text-primary hover:underline underline-offset-4 font-medium"
            >
              {t('signUpLink')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
