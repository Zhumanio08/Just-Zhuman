import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/authService';
import supabase from '../services/supabaseClient';

const AuthContext = createContext();

/**
 * Auth Context
 * Manages authentication state (login, signup, logout)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    authService.initListener();

    // Set initial state from the real session (async — the service cache
    // alone may be stale on first load)
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const sessionUser = data?.session?.user ?? authService.getCurrentUser();
      setUser(sessionUser);
      setIsOwner(
        sessionUser?.user_metadata?.is_owner ?? authService.getIsOwner()
      );
      setIsLoading(false);
    });

    // Direct subscription: instant UI updates, no 1s polling delay
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      const u = session?.user ?? null;
      setUser(u);
      setIsOwner(u?.user_metadata?.is_owner ?? false);
      setIsLoading(false);
    });

    return () => {
      alive = false;
      try {
        data?.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.signIn(email, password);
    // signIn returns the fresh session — use it directly instead of the
    // (async) service cache to avoid a race where the UI stays logged out
    const u = result?.user ?? authService.getCurrentUser();
    setUser(u);
    setIsOwner(u?.user_metadata?.is_owner ?? authService.getIsOwner());
    return result;
  }, []);

  const signup = useCallback(async (email, username, password) => {
    const result = await authService.signUp(email, username, password);
    // With email confirmation ON there is no session yet — stay logged out
    // until the user confirms; with it OFF use the fresh session directly
    const u = result?.session?.user ?? result?.user ?? null;
    if (u) {
      setUser(u);
      setIsOwner(u?.user_metadata?.is_owner ?? false);
    } else {
      setUser(null);
      setIsOwner(false);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      // Guarantee the UI logs out even if the network call failed
      setUser(null);
      setIsOwner(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isOwner,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
