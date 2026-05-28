import { create } from 'zustand';

/**
 * authStore — sessão + permissões + empresa ativa.
 * Carregado por `useAuthBootstrap` (em app/providers) e sincronizado com
 * `onAuthStateChange` do Supabase.
 */
export const useAuthStore = create((set, get) => ({
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  session: null,
  user: null,
  companies: [],
  currentCompanyId: null,
  permissions: [],

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
      currentCompanyId:
        session?.user?.app_metadata?.current_company_id ?? get().currentCompanyId,
    }),

  setStatus: (status) => set({ status }),
  setCompanies: (companies) => set({ companies }),
  setCurrentCompanyId: (currentCompanyId) => set({ currentCompanyId }),
  setPermissions: (permissions) => set({ permissions }),

  reset: () =>
    set({
      status: 'unauthenticated',
      session: null,
      user: null,
      companies: [],
      currentCompanyId: null,
      permissions: [],
    }),
}));

/** Seletor: empresa ativa (objeto). */
export const useCurrentCompany = () =>
  useAuthStore((s) => s.companies.find((c) => c.id === s.currentCompanyId) ?? null);
