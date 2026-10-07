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
    this.authSubscription = null;
    // Legacy alias: older code treated this as an unsubscribe function.
    // In supabase-js v2 it is { data: { subscription } } — never call it.
    this.listener = null;
  }

  /**
   * Initialize auth state listener
   */
  initListener() {
    if (this.authSubscription) {
      try {
        this.authSubscription.unsubscribe();
      } catch {
        // ignore
      }
      this.authSubscription = null;
    }
    if (this.listener?.data?.subscription) {
      try {
        this.listener.data.subscription.unsubscribe();
      } catch {
        // ignore
      }
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
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

    this.authSubscription = data?.subscription ?? null;
    this.listener = data ? { data } : null;

    // Initial load
    const persistedSession = localStorage.getItem('supabase_session');
    if (persistedSession) {
      try {
        const session = JSON.parse(persistedSession);
        const persistedUser = localStorage.getItem('supabase_user');
        if (session && persistedUser) {
          this.user = session.user;
          const parsedUser = JSON.parse(persistedUser);
          this.isOwner = parsedUser?.user_metadata?.is_owner ?? false;
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
   */
  async signUp(email, username, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          // Owner is granted server-side ONLY (see supabase/deploy/06_owner_security.sql).
          // Never accept this flag from the client.
          is_owner: false,
        },
      },
    });

    if (error) throw error;

    // Create the user record in the users table
    await this.createUserRecord(email, username);

    return data;
  }

  /**
   * Create the user record in the users table
   */
  async createUserRecord(email, username) {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('No authenticated user');

    const userId = user.id;

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email,
      username,
      is_owner: false,
    });

    if (insertError) throw insertError;

    return { id: userId, email, username, is_owner: false };
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      if (this.authSubscription) {
        try {
          this.authSubscription.unsubscribe();
        } catch {
          // ignore
        }
        this.authSubscription = null;
      }
      this.listener = null;
      this.user = null;
      this.isOwner = false;
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('supabase_user');
      localStorage.removeItem('is_owner');
    }
  }

  /**
   * Fetch the public profile row (username, created_at) for a user.
   * Used e.g. for the "Member since" stat on the Profile page.
   */
  async getProfile(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
    return data;
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
   * NB: named getIsOwner (not isOwner) to avoid shadowing the this.isOwner property
   */
  getIsOwner() {
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
