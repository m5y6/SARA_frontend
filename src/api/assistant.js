import { api } from './client';

export async function askQuestion({ question, sesion_id, signal }) {
  const { data } = await api.post('/chat', { question, sesion_id }, { signal });
  return data;
}