import { create } from 'zustand';
import { api, type ApiError } from './api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post<{ accessToken: string }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('accessToken', data.accessToken);
      set({
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const detail =
        typeof err === 'object' &&
        err !== null &&
        Array.isArray((err as Record<string, unknown>).detail)
          ? ((err as Record<string, unknown>).detail as string[])[0]
          : 'Error al iniciar sesión';
      set({ isLoading: false, error: detail, isAuthenticated: false });
      throw err;
    }
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
