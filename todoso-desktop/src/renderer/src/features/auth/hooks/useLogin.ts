import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../authStore';
import { LoginCredentials } from '../types/auth';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { rememberMe, ...rest } = credentials;
      const tokens = await authApi.login(rest);
      return { tokens, rememberMe };
    },
    onSuccess: async ({ tokens, rememberMe }) => {
      await setSession(tokens, rememberMe);
    },
    onError: (error: any) => {
      console.error('[useLogin] Error:', error);
    }
  });
}
