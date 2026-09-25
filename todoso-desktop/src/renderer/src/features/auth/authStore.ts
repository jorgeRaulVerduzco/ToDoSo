import { create } from 'zustand';
import { TokenPair } from '../types/auth';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  rememberMe: boolean;
  setSession: (tokens: TokenPair, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setInitializing: (isInitializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  rememberMe: true,

  setSession: async (tokens: TokenPair, rememberMe: boolean) => {
    await window.electronAPI.auth.setRefreshToken(tokens.refresh, rememberMe);
    set({
      accessToken: tokens.access,
      isAuthenticated: true,
      rememberMe,
      isInitializing: false
    });
  },

  logout: async () => {
    await window.electronAPI.auth.clearRefreshToken();
    set({
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false
    });
  },

  setInitializing: (isInitializing: boolean) => {
    set({ isInitializing });
  }
}));
