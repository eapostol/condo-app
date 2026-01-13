import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("condo_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("condo_token"));

  useEffect(() => {
    if (user) localStorage.setItem("condo_user", JSON.stringify(user));
    else localStorage.removeItem("condo_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("condo_token", token);
    else localStorage.removeItem("condo_token");
  }, [token]);

  const DEBUG_AUTH =
    import.meta.env.VITE_DEBUG_AUTH === "true" ||
    localStorage.getItem("debug_auth") === "true";

  const login = (nextUser, nextToken, provider) => {
    const mergedUser = provider ? { ...nextUser, provider } : nextUser;

    setUser(mergedUser);
    setToken(nextToken);

    if (DEBUG_AUTH) {
      console.debug("[auth] login ok", {
        provider: mergedUser?.provider || "unknown",
        email: mergedUser?.email,
        role: mergedUser?.role,
      });
    }
  };

  const logout = () => {
    if (DEBUG_AUTH) console.debug('[auth] logout');
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
