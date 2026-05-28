import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  return {
    status,
    user,
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
