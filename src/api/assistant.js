import { api } from './client';

export async function askQuestion({ question }) {
  const { data } = await api.post('/ask', { question });
  return data;
}