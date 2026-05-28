import { usePermission } from '@/hooks/usePermission';

/**
 * <Can permission="customers.create"> ... </Can>
 * <Can permission={['x','y']} all> ... </Can>
 * Renderiza children apenas se o usuário tiver a(s) permissão(ões).
 */
export function Can({ permission, all = false, fallback = null, children }) {
  const ok = usePermission(permission, { all });
  if (!ok) return fallback;
  return children;
}
