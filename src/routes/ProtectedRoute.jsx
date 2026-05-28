import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

/**
 * ProtectedRoute — exige sessão e (opcionalmente) permissões.
 */
export function ProtectedRoute({ children, requiredPermissions, all }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasPermission = usePermission(requiredPermissions, { all });
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }
  if (requiredPermissions && !hasPermission) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}
