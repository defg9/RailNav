import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
export const TOKEN_STORAGE_KEY = 'railnav_admin_token';

/**
 * Checks if a JWT token is structurally valid and unexpired.
 */
export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload || !payload.exp) return true;
    // payload.exp is in seconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved && isTokenValid(saved)) return saved;
    if (saved) localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  });

  const login = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setTokenState(newToken);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setTokenState(null);
  }, []);

  const isAuthenticated = Boolean(token && isTokenValid(token));

  // Sync token changes across tabs or window storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        if (e.newValue && isTokenValid(e.newValue)) {
          setTokenState(e.newValue);
        } else {
          setTokenState(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
