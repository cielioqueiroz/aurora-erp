import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsRepository } from '@/repositories/notificationsRepository';

const KEY = ['notifications'];

export function useNotifications({ limit = 20 } = {}) {
  return useQuery({
    queryKey: [...KEY, { limit }],
    queryFn: () => notificationsRepository.list({ limit }),
    staleTime: 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...KEY, 'unread-count'],
    queryFn: () => notificationsRepository.countUnread(),
    staleTime: 60_000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsRepository.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsRepository.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
