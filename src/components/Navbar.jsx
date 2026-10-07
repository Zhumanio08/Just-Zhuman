import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const SWATCHES = [
  '#7c3aed', '#2563eb', '#0ea5e9', '#059669',
  '#22c55e', '#f97316', '#ef4444', '#ec4899',
];

/**
 * Navbar Component
 * Responsive navigation: inline links on desktop, hamburger menu on mobile.
 * Includes theme toggle, arbitrary accent color picker (popover),
 * and EN/RU language switcher.
 */
export default function Navbar() {
  const { user, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleMode, accentColor, setAccent } = useTheme();
  const { t, lang, toggleLang } = useLanguage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [hexInput, setHexInput] = useState(accentColor);

  const colorRef = useRef(null);
  const menuRef = useRef(null);

  // Close popovers when clicking outside of them
  useEffect(() => {
    const handleClick = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setColorOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keep the hex input in sync when the accent changes elsewhere
  useEffect(() => {
    setHexInput(accentColor);
  }, [accentColor]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const applyHex = (value) => {
    const trimmed = (value || '').trim();
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    // Accept #RGB as well as #RRGGBB
    let normalized = null;
    if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
      normalized = `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`;
    } else if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
      normalized = withHash;
    }
    if (normalized) {
      setAccent(normalized.toLowerCase());
      setHexInput(normalized.toLowerCase());
      return true;
    }
    return false;
  };

  const navbarBg = mode === 'dark' ? 'dark:bg-gray-900 bg-gray-50' : 'bg-white';
  const linkClass =
    'block px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:underline underline-offset-4 transition-colors';
  const btnClass =
    'flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';

  return (
    <header className={`${navbarBg} border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 relative z-40`}>
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
              Just <span style={{ color: accentColor }}>Zhuman</span>
            </h1>
            <span className="hidden sm:inline-block text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {t('navBlog')}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-1">
              <a href="/feed" className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:underline underline-offset-4 transition-colors">
                {t('navFeed')}
              </a>
              {user && (
                <a href="/profile" className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:underline underline-offset-4 transition-colors">
                  {t('navProfile')}
                </a>
              )}
              {isOwner && (
                <a href="/create" className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {t('navNewPost')}
                </a>
              )}
            </div>
            {/* Accent color picker */}
            <div className="relative" ref={colorRef}>
              <button
                onClick={() => setColorOpen((prev) => !prev)}
                className={btnClass}
                title={t('navColors')}
                aria-label={t('navColors')}
                aria-expanded={colorOpen}
              >
                <span
                  className="block w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: accentColor }}
                />
              </button>

              {colorOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {t('navColors')}
                  </p>

                  {/* Presets */}
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {SWATCHES.map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccent(color)}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          boxShadow:
                            accentColor === color
                              ? `0 0 0 2px #fff, 0 0 0 4px ${color}`
                              : '0 0 0 1px rgba(0,0,0,0.15)',
                        }}
                        aria-label={color}
                      />
                    ))}
                  </div>

                  {/* Any color */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : '#7c3aed'}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-9 h-9 cursor-pointer"
                      style={{ padding: 0, border: 'none', background: 'transparent' }}
                      aria-label={t('customColor')}
                    />
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      onBlur={(e) => {
                        if (!applyHex(e.target.value)) setHexInput(accentColor);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (!applyHex(e.target.value)) setHexInput(accentColor);
                        }
                      }}
                      placeholder={t('hexPh')}
                      spellCheck={false}
                      className="flex-1 min-w-0 text-xs font-mono px-2 py-1.5 rounded-md
                                 border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-gray-700
                                 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Language switcher */}
            <button
              onClick={toggleLang}
              className={btnClass}
              title={lang === 'en' ? 'Русский' : 'English'}
              aria-label={lang === 'en' ? 'Русский' : 'English'}
            >
              <span className="text-xs font-semibold tracking-wide">
                {lang.toUpperCase()}
              </span>
            </button>

            {/* Theme mode toggle */}
            <button
              onClick={toggleMode}
              className={btnClass}
              title={mode === 'light' ? t('navDark') : t('navLight')}
              aria-label={mode === 'light' ? t('navDark') : t('navLight')}
            >
              <span className={`block w-3 h-3 rounded-full ${mode === 'dark' ? 'bg-current' : 'bg-gray-400'}`} />
              <span className="hidden md:inline ml-1.5">
                {mode === 'light' ? t('navDark') : t('navLight')}
              </span>
            </button>
            {/* Desktop auth controls */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              {user ? (
                <>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline max-w-[120px] truncate">
                    {user.user_metadata?.username || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t('navLogout')}
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:underline transition-colors">
                    {t('navLogin')}
                  </a>
                  <a href="/signup" className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {t('navSignUp')}
                  </a>
                </>
              )}
            </div>

            {/* Mobile hamburger menu */}
            <div className="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className={btnClass}
                aria-label={t('navMenu')}
                aria-expanded={menuOpen}
              >
                <span className="text-lg leading-none">☰</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 p-2 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50">
                  <a href="/feed" onClick={() => setMenuOpen(false)} className={linkClass}>
                    {t('navFeed')}
                  </a>
                  {user && (
                    <a href="/profile" onClick={() => setMenuOpen(false)} className={linkClass}>
                      {t('navProfile')}
                    </a>
                  )}
                  {isOwner && (
                    <a href="/create" onClick={() => setMenuOpen(false)} className={`${linkClass} text-white bg-primary hover:bg-primary-dark mt-1 text-center`}>
                      {t('navNewPost')}
                    </a>
                  )}
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                  {user ? (
                    <>
                      <p className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.user_metadata?.username || user.email}
                      </p>
                      <button onClick={handleLogout} className={`${linkClass} w-full text-left text-red-600 dark:text-red-400`}>
                        {t('navLogout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="/login" onClick={() => setMenuOpen(false)} className={linkClass}>
                        {t('navLogin')}
                      </a>
                      <a href="/signup" onClick={() => setMenuOpen(false)} className={`${linkClass} text-center text-white bg-primary hover:bg-primary-dark mt-1`}>
                        {t('navSignUp')}
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
