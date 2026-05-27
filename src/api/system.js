import { api } from './client';

export async function normalizeText(text) {
  const { data } = await api.post('/normalize-text', { text });
  return data;
}

export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}