import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Navbar Component
 * Navigation bar with logo, links, and logout
 */
export default function Navbar() {
  const { user, isOwner, logout } = useAuth();
  const { mode, toggleMode, accentColor, setAccent } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  const navbarBg = mode === 'dark' ? 'dark:bg-gray-900 bg-gray-50' : 'bg-white';

  return (
    <header className={`${navbarBg} border-b border-gray-200 dark:border-gray-700 transition-colors duration-200`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Just <span style={{ color: accentColor }}>Zhuman</span>
            </h1>
            <span className="hidden sm:inline-block text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              Blog
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/feed"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                         hover:text-primary hover:underline underline-offset-4 transition-colors
                         dark:hover:text-primary-300"
            >
              Feed
            </a>

            {user && (
              <a
                href="/profile"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                           hover:text-primary hover:underline underline-offset-4 transition-colors
                           dark:hover:text-primary-300"
              >
                Profile
              </a>
            )}

            {isOwner && (
              <a
                href="/create"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white
                           bg-primary hover:bg-primary-dark transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                New Post
              </a>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700">
              <button
                onClick={toggleMode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                           transition-colors"
                aria-label="Toggle theme"
              >
                <span className={`block w-3 h-3 rounded-full ${mode === 'dark' ? 'bg-current' : 'bg-gray-400'}`} />
                <span className="hidden sm:inline">{mode === 'light' ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            {/* Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {user.user_metadata?.username || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                             hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <a
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                             hover:text-primary hover:underline transition-colors"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-white
                             bg-primary hover:bg-primary-dark transition-colors
                             focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
