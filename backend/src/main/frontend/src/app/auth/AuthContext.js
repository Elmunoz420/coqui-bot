import React, { createContext, useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'coqui_session';

export const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.role ? session : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  const login = useCallback(async ({ username, password }) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || 'No se pudo iniciar sesión');
    }

    const nextUser = {
      id: payload.id,
      username: payload.username,
      name: payload.name || payload.username,
      role: payload.role || 'developer',
      status: payload.status,
    };

    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    return nextUser;
  }, []);

  const register = useCallback(async ({ name, username, password, role }) => {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, role }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || 'No se pudo crear la cuenta');
    }

    const nextUser = {
      id: payload.id,
      username: payload.username,
      name: payload.name || payload.username,
      role: payload.role || 'developer',
      status: payload.status,
    };

    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    return nextUser;
  }, []);


  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
  }), [login, logout, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
