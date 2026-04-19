// @ts-check
import React, { createContext, useContext, useEffect, useState } from "react";

/** @typedef {import("../../../shared/contracts/auth.js").AuthProvider} AuthProvider */
/** @typedef {import("../../../shared/contracts/auth.js").AuthSessionUser} AuthSessionUser */

/**
 * @typedef AuthContextValue
 * @property {AuthSessionUser | null} user
 * @property {string | null} token
 * @property {(nextUser: AuthSessionUser, nextToken: string, provider?: AuthProvider) => void} login
 * @property {() => void} logout
 */

/**
 * @returns {AuthSessionUser | null}
 */
function readStoredUser() {
  const stored = localStorage.getItem("condo_user");
  return stored ? /** @type {AuthSessionUser} */ (JSON.parse(stored)) : null;
}

/**
 * @returns {string | null}
 */
function readStoredToken() {
  return localStorage.getItem("condo_token");
}

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);

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

  /**
   * @param {AuthSessionUser} nextUser
   * @param {string} nextToken
   * @param {AuthProvider} [provider]
   */
  const login = (nextUser, nextToken, provider) => {
    /** @type {AuthSessionUser} */
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

  /** @type {AuthContextValue} */
  const value = { user, token, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @returns {AuthContextValue}
 */
export function useAuth() {
  return /** @type {AuthContextValue} */ (useContext(AuthContext));
}
