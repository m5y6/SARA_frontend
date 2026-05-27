import axios from 'axios';
import { getStoredAuthSession } from '../lib/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const session = getStoredAuthSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});