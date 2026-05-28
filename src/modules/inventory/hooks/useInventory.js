import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryRepository } from '@/repositories/inventoryRepository';

const KEYS = {
  balance: ['inventory', 'balance'],
  movements: (params) => ['inventory', 'movements', params],
};

export function useStockBalance() {
  return useQuery({
    queryKey: KEYS.balance,
    queryFn: () => inventoryRepository.getStockBalance(),
  });
}

export function useInventoryMovements(params = {}) {
  return useQuery({
    queryKey: KEYS.movements(params),
    queryFn: () => inventoryRepository.list({ ...params, order: { field: 'created_at', asc: false } }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => inventoryRepository.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
