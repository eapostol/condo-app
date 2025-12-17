import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../components/apiClient.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('manager@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6 mt-10">
      <h1 className="text-xl font-semibold mb-4 text-slate-800">Sign in</h1>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Sign in
        </button>
      </form>

      <div className="mt-6 border-t pt-4">
        <p className="text-xs text-slate-500 mb-2 text-center">
          Or sign in with
        </p>
        <div className="flex gap-3">
          <a
            href={`${apiBase}/auth/google`}
            className="flex-1 border rounded px-3 py-2 text-xs text-center hover:bg-slate-50"
          >
            Google
          </a>
          <a
            href={`${apiBase}/auth/microsoft`}
            className="flex-1 border rounded px-3 py-2 text-xs text-center hover:bg-slate-50"
          >
            Microsoft
          </a>
        </div>
      </div>
    </div>
  );
}
