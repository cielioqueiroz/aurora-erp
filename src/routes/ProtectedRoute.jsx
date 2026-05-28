import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export function ProtectedRoute({ children, requiredPermissions, all }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasCompanies = useAuthStore((s) => s.companies.length > 0);
  const hasPermission = usePermission(requiredPermissions, { all });
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }
  if (!hasCompanies) {
    return <Navigate to={ROUTES.SIGNUP} replace />;
  }
  if (requiredPermissions && !hasPermission) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}
