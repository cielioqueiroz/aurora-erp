import { useAuthStore } from '@/store/authStore';

/**
 * useAuth — seleciona campos individuais do authStore.
 * IMPORTANTE: usar seletores atômicos (não retornar objeto literal de dentro do store)
 * porque Zustand v5 não tolera seletores que produzem novas referências a cada render
 * (causa "Maximum update depth exceeded").
 */
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
