import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">
        Welcome, {user?.name}
      </h1>
      <p className="text-sm text-slate-600">
        Role: <span className="font-medium">{user?.role}</span>
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {['manager', 'admin'].includes(user?.role) && (
          <Link
            to="/manager/reports"
            className="block bg-white shadow rounded p-4 hover:shadow-md transition"
          >
            <h2 className="font-semibold text-slate-800 mb-1">
              Manager monthly report
            </h2>
            <p className="text-xs text-slate-600">
              View open work orders and payments summary.
            </p>
          </Link>
        )}
        {['board', 'admin'].includes(user?.role) && (
          <Link
            to="/board/reports"
            className="block bg-white shadow rounded p-4 hover:shadow-md transition"
          >
            <h2 className="font-semibold text-slate-800 mb-1">
              Board monthly snapshot
            </h2>
            <p className="text-xs text-slate-600">
              See high-level financials and KPIs.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
