import { useAuthStore } from '@/store/authStore';

export function useCurrentCompany() {
  return useAuthStore((s) => s.companies.find((c) => c.id === s.currentCompanyId) ?? null);
}

export function useCompanies() {
  return useAuthStore((s) => s.companies);
}
