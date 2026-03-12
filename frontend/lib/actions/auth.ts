import { api } from '@/lib/api';

interface LoginResponse {
  accessToken: string;
}

interface RegisterResponse {
  accessToken: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function loginAction(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

export async function registerAction(payload: RegisterPayload) {
  return api.post<RegisterResponse>('/auth/register', payload);
}
