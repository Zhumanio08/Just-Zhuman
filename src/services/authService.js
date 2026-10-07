import supabase from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Auth Service
 * Handles all authentication operations
 */
class AuthService {
  constructor() {
    this.user = null;
    this.isOwner = false;
    this.listener = null;
  }

  /**
   * Initialize auth state listener
   */
  initListener() {
    if (this.listener) {
      this.listener();
    }

    this.listener = supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user ?? null;
      this.isOwner = session?.user?.user_metadata?.is_owner ?? false;
      localStorage.setItem('supabase_session', JSON.stringify(session));
      localStorage.setItem('supabase_user', JSON.stringify(session?.user ?? null));
      if (session?.user?.user_metadata?.is_owner) {
        localStorage.setItem('is_owner', 'true');
      } else {
        localStorage.setItem('is_owner', 'false');
      }
    });

    // Initial load
    const persistedSession = localStorage.getItem('supabase_session');
    if (persistedSession) {
      try {
        const session = JSON.parse(persistedSession);
        const persistedUser = localStorage.getItem('supabase_user');
        if (session && persistedUser) {
          this.user = session.user;
          this.isOwner = persistedUser.user_metadata?.is_owner ?? false;
        }
      } catch (error) {
        console.error('Failed to parse persisted session:', error);
      }
    }
  }

  /**
   * Sign up with email, username, and password
   * @param {string} email
   * @param {string} username
   * @param {string} password
   * @param {boolean} [isOwner=false]
   */
  async signUp(email, username, password, isOwner = false) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          is_owner: isOwner,
        },
      },
    });

    if (error) throw error;

    // Create the user record in the users table
    await this.createUserRecord(email, username, isOwner);

    return data;
  }

  /**
   * Create the user record in the users table
   */
  async createUserRecord(email, username, isOwner = false) {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('No authenticated user');

    const userId = user.id;

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email,
      username,
      is_owner: isOwner,
    });

    if (insertError) throw insertError;

    return { id: userId, email, username, is_owner: isOwner };
  }

  /**
   * Sign in with email or username and password
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    if (this.listener) {
      this.listener();
      this.listener = null;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    this.user = null;
    this.isOwner = false;
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('supabase_user');
    localStorage.removeItem('is_owner');
  }

  /**
   * Get current session
   */
  getSession() {
    const persistedSession = localStorage.getItem('supabase_session');
    if (!persistedSession) return null;
    try {
      return JSON.parse(persistedSession);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.user;
  }

  /**
   * Check if user is owner
   */
  isOwner() {
    return this.isOwner;
  }

  /**
   * Get current user safely
   */
  getCurrentUser() {
    return this.user;
  }
}

export const authService = new AuthService();
