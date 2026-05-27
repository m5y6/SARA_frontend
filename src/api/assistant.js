import { api } from './client';

export async function askQuestion({ question, temperature = 0.3, sesionId }) {
  const payload = {
    question,
    temperature,
  };

  if (sesionId !== undefined && sesionId !== null && sesionId !== '') {
    payload.sesion_id = Number.isNaN(Number(sesionId)) ? sesionId : Number(sesionId);
  }

  const { data } = await api.post('/ask', payload);
  return data;
}

export async function normalizeText(text) {
  const { data } = await api.post('/normalize-text', { text });
  return data;
}

export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}