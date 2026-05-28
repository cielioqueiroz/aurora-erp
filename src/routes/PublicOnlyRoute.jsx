import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasCompanies = useAuthStore((s) => s.companies.length > 0);
  const { pathname } = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    if (pathname === ROUTES.SIGNUP && !hasCompanies) return children;
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}
