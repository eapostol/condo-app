import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ManagerReports from './pages/ManagerReports.jsx';
import BoardReports from './pages/BoardReports.jsx';
import SocialLoginHandler from './pages/SocialLoginHandler.jsx';
import { useAuth } from './components/AuthContext.jsx';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/social-login" element={<SocialLoginHandler />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <ManagerReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/board/reports"
            element={
              <ProtectedRoute roles={['board', 'admin']}>
                <BoardReports />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
