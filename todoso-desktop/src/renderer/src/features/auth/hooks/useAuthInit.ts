import { useEffect } from 'react';
import { useAuthStore } from '../authStore';
import { authApi } from '../api/authApi';

export function useAuthInit() {
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const refreshToken = await window.electronAPI.auth.getRefreshToken();
        
        if (refreshToken) {
          const newTokens = await authApi.refresh(refreshToken);
          if (mounted) {
            await setSession(
              { access: newTokens.access, refresh: newTokens.refresh || refreshToken },
              true // We assume true if we loaded from disk
            );
          }
        } else {
          if (mounted) {
            await logout();
          }
        }
      } catch (err) {
        console.error('[useAuthInit] Failed to init auth', err);
        if (mounted) {
          await logout();
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setSession, logout, setInitializing]);
}
