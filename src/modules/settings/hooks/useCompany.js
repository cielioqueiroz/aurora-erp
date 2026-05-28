import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authRepository } from '@/repositories/authRepository';
import { companyRepository } from '@/repositories/companyRepository';
import { useAuthStore } from '@/store/authStore';

export function useUpdateCompany(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => companyRepository.update(id, payload),
    onSuccess: async (data, vars, ctx) => {
      const companies = await authRepository.listMyCompanies().catch(() => null);
      if (companies) useAuthStore.getState().setCompanies(companies);
      qc.invalidateQueries({ queryKey: ['companies'] });
      options.onSuccess?.(data, vars, ctx);
    },
    onError: options.onError,
  });
}
