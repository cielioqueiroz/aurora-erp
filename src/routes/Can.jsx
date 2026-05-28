import { usePermission } from '@/hooks/usePermission';

export function Can({ permission, all = false, fallback = null, children }) {
  const ok = usePermission(permission, { all });
  if (!ok) return fallback;
  return children;
}
