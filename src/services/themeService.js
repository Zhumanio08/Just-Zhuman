import supabase from './supabaseClient';

/**
 * Theme Service
 * Handles light/dark mode and accent color preferences
 */
class ThemeService {
  constructor() {
    this.defaultTheme = {
      mode: 'light',
      accentColor: '#7c3aed', // Default purple
    };
    this.themes = {
      default: { mode: 'light', accentColor: '#7c3aed' },
      ocean: { mode: 'dark', accentColor: '#0ea5e9' },
      forest: { mode: 'light', accentColor: '#22c55e' },
      sunset: { mode: 'dark', accentColor: '#f97316' },
    };
  }

  /**
   * Get the CSS variable name for a color role
   */
  getColorVar(role, variant = 'DEFAULT') {
    return `var(--color-${role}-${variant})`;
  }

  /**
   * Get the stored theme for the current user
   */
  async getStoredTheme(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('theme_preference')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch theme preference:', error);
      return null;
    }

    return data?.theme_preference || null;
  }

  /**
   * Fetch the theme for the current user
   */
  async fetchUserTheme(userId) {
    if (!userId) return this.defaultTheme;
    return this.getStoredTheme(userId);
  }

  /**
   * Update the user's theme preference in Supabase
   */
  async updateUserTheme(userId, mode, accentColor) {
    if (!userId) return;

    const { error } = await supabase
      .from('users')
      .update({
        theme_preference: { mode, accentColor },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update theme preference:', error);
    }
  }

  /**
   * Get the theme object by name
   */
  getTheme(name) {
    return this.themes[name] || this.defaultTheme;
  }

  /**
   * Apply a theme to the document
   */
  applyTheme(mode, accentColor) {
    const root = document.documentElement;
    const isDark = mode === 'dark';

    // Apply color scheme
    root.style.setProperty('--color-scheme', isDark ? 'dark' : 'light');

    // Apply accent color
    root.style.setProperty('--color-primary', accentColor);
    root.style.setProperty('--color-primary-light', this.adjustColor(accentColor, -30));
    root.style.setProperty('--color-primary-dark', this.adjustColor(accentColor, 40));

    // Apply secondary color (a complementary tone based on accent)
    const secondary = this.getComplementary(accentColor);
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-light', this.adjustColor(secondary, -30));
    root.style.setProperty('--color-secondary-dark', this.adjustColor(secondary, 40));

    // Apply dark mode class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * Get a complementary color (approximation using a fixed set)
   */
  getComplementary(hex) {
    // Use a fixed complementary palette based on accent
    const palette = {
      '#7c3aed': '#f97316', // Purple -> Orange
      '#0ea5e9': '#22c55e', // Blue -> Green
      '#22c55e': '#0ea5e9', // Green -> Blue
      '#f97316': '#7c3aed', // Orange -> Purple
      '#ef4444': '#3b82f6', // Red -> Blue
      '#3b82f6': '#ef4444', // Blue -> Red
    };
    return palette[hex] || '#7c3aed';
  }

  /**
   * Adjust color lightness
   */
  adjustColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

export const themeService = new ThemeService();
