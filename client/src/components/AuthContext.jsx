import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('condo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('condo_token'));

  useEffect(() => {
    if (user) localStorage.setItem('condo_user', JSON.stringify(user));
    else localStorage.removeItem('condo_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('condo_token', token);
    else localStorage.removeItem('condo_token');
  }, [token]);

  const login = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
