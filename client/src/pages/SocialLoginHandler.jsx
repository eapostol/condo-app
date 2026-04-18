// @ts-check
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { jwtDecode } from "jwt-decode";

/** @typedef {import("../../../shared/contracts/auth.js").AuthProvider} AuthProvider */
/** @typedef {import("../../../shared/contracts/auth.js").AuthSessionUser} AuthSessionUser */
/** @typedef {import("../../../shared/contracts/auth.js").JwtSessionPayload} JwtSessionPayload */

export default function SocialLoginHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    /** @type {AuthProvider} */
    const provider = /** @type {AuthProvider} */ (
      params.get("provider") || "social"
    );

    if (token) {
      try {
        /** @type {JwtSessionPayload} */
        const decoded = jwtDecode(token);
        /** @type {AuthSessionUser} */
        const user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          provider,
        };
        login(user, token, provider);
        navigate("/");
      } catch (err) {
        console.error("Failed to decode social token", /** @type {any} */ (err));
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [location.search]);

  return (
    <div className="text-sm text-slate-600">Completing social login...</div>
  );
}
