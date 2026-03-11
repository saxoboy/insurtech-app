import { create } from 'zustand';
import { api, type ApiError } from './api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('accessToken', data.accessToken);
    set({ token: data.accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));

export type { ApiError };
