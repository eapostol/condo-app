import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Condo Portal</span>
          <span className="text-xs text-slate-500">MERN Demo</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link to="/" className="text-sm text-slate-700 hover:text-slate-900">
                Dashboard
              </Link>
              {['manager', 'admin'].includes(user.role) && (
                <Link
                  to="/manager/reports"
                  className="text-sm text-slate-700 hover:text-slate-900"
                >
                  Manager
                </Link>
              )}
              {['board', 'admin'].includes(user.role) && (
                <Link
                  to="/board/reports"
                  className="text-sm text-slate-700 hover:text-slate-900"
                >
                  Board
                </Link>
              )}
            </>
          )}
          {user ? (
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
