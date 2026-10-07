import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/authService';

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

    // Set initial state
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsOwner(authService.getIsOwner());
    setIsLoading(false);

    // Poll for auth state changes (fallback in case the listener fails)
    const interval = setInterval(() => {
      const current = authService.getCurrentUser();
      if (current) {
        setUser(current);
        setIsOwner(authService.getIsOwner());
      } else {
        setUser(null);
        setIsOwner(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.signIn(email, password);
    setUser(authService.getCurrentUser());
    setIsOwner(authService.getIsOwner());
    return result;
  }, []);

  const signup = useCallback(async (email, username, password) => {
    const result = await authService.signUp(email, username, password);
    setUser(authService.getCurrentUser());
    setIsOwner(authService.getIsOwner());
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setIsOwner(false);
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
