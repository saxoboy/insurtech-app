import { create } from 'zustand';
import { loginAction } from './actions/auth';
import type { ApiError } from './api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginAction(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Strict`;
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
    document.cookie =
      'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    set({ token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (token) {
      document.cookie = `accessToken=${token}; path=/; SameSite=Strict`;
      set({ token, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));

export type { ApiError };
