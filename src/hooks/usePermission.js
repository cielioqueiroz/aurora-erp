import { useAuthStore } from '@/store/authStore';

export function usePermission(required, { all = false } = {}) {
  return useAuthStore((s) => {
    if (!required) return true;
    const list = Array.isArray(required) ? required : [required];
    if (list.length === 0) return true;
    if (s.permissions.length === 0) return false;
    return all
      ? list.every((p) => s.permissions.includes(p))
      : list.some((p) => s.permissions.includes(p));
  });
}
