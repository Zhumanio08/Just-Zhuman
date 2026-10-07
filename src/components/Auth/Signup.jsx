import React, { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Signup Component
 * Email/username/password signup
 */
export default function Signup() {
  const { signup, isLoading, user } = useAuth();
  const { mode, accentColor } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
    setNotice('');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    // Validation
    if (!formData.email || !formData.username || !formData.password) {
      setError(t('errAllFields'));
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errPwMatch'));
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t('errPwLength'));
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signup(formData.email, formData.username, formData.password);
      if (result?.session) {
        // Signed in immediately (email confirmation disabled) — go to the feed
        navigate('/feed', { replace: true });
      } else {
        // Email confirmation required — tell the user to check their inbox
        setNotice(t('confirmEmailMsg'));
      }
    } catch (err) {
      setError(err.message || t('signupFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, signup, navigate, t]);

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
            {t('signupTitle')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('signupSubtitle')}
          </p>
        </div>

        <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 sm:p-8`}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputBaseClasses}
                placeholder={t('emailPh')}
                autoComplete="email"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('username')}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={inputBaseClasses}
                placeholder={t('usernamePh')}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
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
                placeholder={t('pwMinPh')}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputBaseClasses}
                placeholder={t('repeatPwPh')}
                autoComplete="new-password"
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
                         disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? t('creatingAccount') : t('signUpBtn')}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('haveAccount')}{' '}
            <a
              href="/login"
              className="text-primary hover:underline underline-offset-4 font-medium"
            >
              {t('signInLink')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
