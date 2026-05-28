import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersRepository } from '@/repositories/ordersRepository';
import { createResourceHooks } from '@/hooks/useResource';

export const ordersHooks = createResourceHooks('orders', ordersRepository);

export function useOrderDetail(id) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersRepository.getDetail(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersRepository.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
