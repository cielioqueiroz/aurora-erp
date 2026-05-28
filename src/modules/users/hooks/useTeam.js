import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamRepository } from '@/repositories/teamRepository';

export function useTeamMembers(params = {}) {
  return useQuery({
    queryKey: ['team', 'list', params],
    queryFn: () => teamRepository.listTeamMembers(params),
    placeholderData: (prev) => prev,
  });
}

export function useTeamRoles() {
  return useQuery({
    queryKey: ['team', 'roles'],
    queryFn: () => teamRepository.listRoles(),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => teamRepository.inviteMember(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => teamRepository.removeMember(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}
