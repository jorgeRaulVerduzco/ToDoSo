import axios from 'axios';
import { useAuthStore } from '../features/auth/authStore';
import { authApi } from '../features/auth/api/authApi';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (val?: any) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = await window.electronAPI.auth.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const newTokens = await authApi.refresh(refreshToken);
        
        // El backend puede o no devolver un nuevo refresh. 
        // Si no devuelve, re-usamos el anterior.
        const tokensToSave = {
          access: newTokens.access,
          refresh: newTokens.refresh || refreshToken
        };

        const currentRememberMe = useAuthStore.getState().rememberMe;
        await useAuthStore.getState().setSession(tokensToSave, currentRememberMe);
        
        processQueue(null, newTokens.access);
        
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        await useAuthStore.getState().logout();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
