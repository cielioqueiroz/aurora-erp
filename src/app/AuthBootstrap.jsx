import { useEffect } from 'react';
import { authRepository } from '@/repositories/authRepository';
import { useAuthStore } from '@/store/authStore';
import {
  isDemoMode,
  DEMO_SESSION,
  DEMO_COMPANIES,
  DEMO_PERMISSIONS,
} from './demoMode';

/**
 * AuthBootstrap — inicializa a sessão do Supabase e mantém o store sincronizado.
 * Renderiza children apenas após a sessão inicial ter sido resolvida.
 */
export function AuthBootstrap({ children }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setCompanies = useAuthStore((s) => s.setCompanies);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const reset = useAuthStore((s) => s.reset);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (isDemoMode) {
      setSession(DEMO_SESSION);
      setCompanies(DEMO_COMPANIES);
      setPermissions(DEMO_PERMISSIONS);
      return undefined;
    }

    let active = true;

    async function loadContext(session) {
      if (!session) {
        setCompanies([]);
        setPermissions([]);
        return;
      }
      try {
        const [companies, permissions] = await Promise.all([
          authRepository.listMyCompanies().catch(() => []),
          authRepository.listMyPermissions().catch(() => []),
        ]);
        if (!active) return;
        setCompanies(companies ?? []);
        setPermissions(permissions ?? []);
      } catch {
        // Silenciar para não bloquear bootstrap em caso de Supabase offline
        if (!active) return;
        setCompanies([]);
        setPermissions([]);
      }
    }

    async function init() {
      try {
        const session = await authRepository.getSession();
        if (!active) return;
        setSession(session);
        await loadContext(session);
      } catch {
        if (!active) return;
        reset();
      }
    }

    init();

    const unsubscribe = authRepository.onAuthStateChange(({ event, session }) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        reset();
        return;
      }
      loadContext(session);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [reset, setCompanies, setPermissions, setSession]);

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando AURORA ERP…</p>
        </div>
      </div>
    );
  }

  return children;
}
