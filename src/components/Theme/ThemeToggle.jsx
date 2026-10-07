import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle Component
 * Toggle between light and dark mode
 */
export default function ThemeToggle() {
  const { mode, toggleMode, accentColor, setAccent } = useTheme();

  const themes = [
    { name: 'default', label: 'Default', color: '#7c3aed' },
    { name: 'ocean', label: 'Ocean', color: '#0ea5e9' },
    { name: 'forest', label: 'Forest', color: '#22c55e' },
    { name: 'sunset', label: 'Sunset', color: '#f97316' },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Mode Toggle */}
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                   transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary/30
                   dark:focus:ring-primary/50"
        style={{ backgroundColor: mode === 'dark' ? accentColor : '#f3f4f6', color: mode === 'dark' ? '#fff' : '#374151' }}
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className={`block w-3 h-3 rounded-full ${mode === 'dark' ? 'bg-current' : 'bg-gray-400'}`} />
        <span className="hidden sm:inline">{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      {/* Accent Color Presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Accent:</span>
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => setAccent(theme.color)}
            className={`w-5 h-5 rounded-full transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30
                        ${accentColor === theme.color ? 'ring-2 ring-offset-1 scale-110' : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'}`}
            style={{
              backgroundColor: theme.color,
              boxShadow: accentColor === theme.color ? `0 0 0 2px #fff, 0 0 0 4px ${accentColor}` : 'none',
            }}
            title={`${theme.label} theme`}
            aria-label={`${theme.label} accent color`}
          />
        ))}
      </div>
    </div>
  );
}
