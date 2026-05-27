import { api } from './client';

export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    userId: data.user_id,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}