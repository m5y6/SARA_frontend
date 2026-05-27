const STORAGE_KEY = 'sara_auth_session';

export function getStoredAuthSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}