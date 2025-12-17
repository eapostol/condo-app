import axios from 'axios';
import { useAuth } from './AuthContext.jsx';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

// Helper hook to attach auth
export function useApi() {
  const { token } = useAuth();

  const client = axios.create({ baseURL });
  client.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}
