import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';

export function useLogout() {
  const logoutAction = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return async () => {
    await logoutAction();
    navigate('/login', { replace: true });
  };
}
