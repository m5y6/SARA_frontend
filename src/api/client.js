import axios from 'axios';
import { getStoredAuthSession } from '../lib/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const AUTH_INVALIDATED_EVENT = 'sara:auth-invalidated';

function notifyAuthInvalidated() {
  window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
}

function isAuthError(status) {
  return status === 401 || status === 403;
}

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error?.response?.status)) {
      notifyAuthInvalidated();
    }

    return Promise.reject(error);
  },
);