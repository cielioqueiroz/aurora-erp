import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersRepository } from '@/repositories/ordersRepository';
import { inventoryRepository } from '@/repositories/inventoryRepository';
import { createResourceHooks } from '@/hooks/useResource';

export const ordersHooks = createResourceHooks('orders', ordersRepository);

export function useOrderDetail(id) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersRepository.getDetail(id),
    enabled: !!id,
  });
}

export function useSellableProducts() {
  return useQuery({
    queryKey: ['inventory', 'sellable'],
    queryFn: () => inventoryRepository.listSellableProducts(),
    staleTime: 30_000,
  });
}

function useOrderMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (data?.id) qc.invalidateQueries({ queryKey: ['orders', 'detail', data.id] });
    },
  });
}

export function useCreateOrder() {
  return useOrderMutation((payload) => ordersRepository.createOrder(payload));
}

export function useConfirmOrder() {
  return useOrderMutation(({ id, dueDate }) => ordersRepository.confirmOrder(id, dueDate));
}

export function useCancelOrder() {
  return useOrderMutation(({ id }) => ordersRepository.cancelOrder(id));
}

export function usePayOrder() {
  return useOrderMutation(({ id, method }) => ordersRepository.payOrder(id, method));
}

export function useRefundOrder() {
  return useOrderMutation(({ id }) => ordersRepository.refundOrder(id));
}
