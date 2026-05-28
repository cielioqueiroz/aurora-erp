import { useMutation } from '@tanstack/react-query';
import { profileRepository } from '@/repositories/profileRepository';
import { useAuthStore } from '@/store/authStore';

export function useUpdateProfile(options = {}) {
  return useMutation({
    mutationFn: (payload) => profileRepository.update(payload),
    onSuccess: (session, vars, ctx) => {
      if (session) useAuthStore.getState().setSession(session);
      options.onSuccess?.(session, vars, ctx);
    },
    onError: options.onError,
  });
}
