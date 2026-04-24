import React, { createContext, useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'coqui_mock_session';

const MOCK_USERS = {
  admin: {
    id: 'admin-fernanda',
    username: 'fernanda.admin',
    name: 'Fernanda Jiménez',
    role: 'admin',
  },
  developer: {
    id: 'dev-fernanda',
    username: 'fernanda',
    name: 'Fernanda Jiménez',
    role: 'developer',
  },
};

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

  const loginAs = useCallback((role) => {
    const nextUser = MOCK_USERS[role];
    if (!nextUser) return;
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    loginAs,
    logout,
    isAuthenticated: Boolean(user),
  }), [loginAs, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
