import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { themeService } from '../services/themeService';
import { authService } from '../services/authService';

const ThemeContext = createContext();

/**
 * Theme Context
 * Manages light/dark mode and accent color preferences
 */
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [accentColor, setAccentColor] = useState('#7c3aed');
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedTheme, setSavedTheme] = useState(null);

  const userId = authService.getCurrentUser()?.id || null;

  // Load saved theme from localStorage
  useEffect(() => {
    const loadSavedTheme = () => {
      const saved = localStorage.getItem('theme_preference');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMode(parsed.mode || 'light');
          setAccentColor(parsed.accentColor || '#7c3aed');
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    };

    loadSavedTheme();
  }, [userId]);

  // Fetch theme from Supabase if user is logged in
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAndApply = async () => {
      try {
        const stored = await themeService.fetchUserTheme(userId);
        if (isMounted) {
          if (stored && stored.mode && stored.accentColor) {
            setMode(stored.mode);
            setAccentColor(stored.accentColor);
          } else {
            setMode('light');
            setAccentColor('#7c3aed');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user theme:', error);
        if (isMounted) {
          setMode('light');
          setAccentColor('#7c3aed');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAndApply();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Apply theme to document when mode or accent color changes
  useEffect(() => {
    if (isLoading) return;

    themeService.applyTheme(mode, accentColor);

    // Save to localStorage
    localStorage.setItem('theme_preference', JSON.stringify({ mode, accentColor }));

    // Update Supabase if user is logged in
    if (userId) {
      themeService.updateUserTheme(userId, mode, accentColor).catch((err) => {
        console.error('Failed to save theme:', err);
      });
    }
  }, [mode, accentColor, userId, isLoading]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setAccent = useCallback((color) => {
    if (typeof color !== 'string') return;
    const trimmed = color.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(trimmed)) return;
    setAccentColor(trimmed);
  }, []);

  const value = {
    mode,
    setMode,
    toggleMode,
    accentColor,
    setAccent,
    isDark,
    isLoading,
    themeService,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
