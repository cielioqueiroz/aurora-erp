import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

/**
 * PublicOnlyRoute — rotas para usuários NÃO autenticados (login, signup, recover).
 * Se já autenticado, redireciona para o dashboard — exceto em /signup quando o
 * usuário ainda não vinculou empresa (caso típico do onboarding em 2 passos).
 */
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
