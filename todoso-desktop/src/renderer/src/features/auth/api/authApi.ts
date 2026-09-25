import axios from 'axios';
import { LoginCredentials, TokenPair } from '../types/auth';

// Raw axios instance WITHOUT interceptors, strictly for auth endpoints
const rawApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authApi = {
  login: async (credentials: Omit<LoginCredentials, 'rememberMe'>): Promise<TokenPair> => {
    const response = await rawApi.post<TokenPair>('/auth/login/', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenPair> => {
    const response = await rawApi.post<TokenPair>('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  }
};
