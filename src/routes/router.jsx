import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { ROUTES } from '@/constants/routes';
import { PERMISSIONS } from '@/constants/permissions';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { NotFoundPage } from '@/modules/_shared/NotFoundPage';

const LoginPage = lazy(() =>
  import('@/modules/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('@/modules/auth/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const RecoverPage = lazy(() =>
  import('@/modules/auth/pages/RecoverPage').then((m) => ({ default: m.RecoverPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/modules/auth/pages/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CustomersListPage = lazy(() =>
  import('@/modules/customers/pages/CustomersListPage').then((m) => ({
    default: m.CustomersListPage,
  })),
);
const SuppliersListPage = lazy(() =>
  import('@/modules/suppliers/pages/SuppliersListPage').then((m) => ({
    default: m.SuppliersListPage,
  })),
);
const ProductsListPage = lazy(() =>
  import('@/modules/products/pages/ProductsListPage').then((m) => ({
    default: m.ProductsListPage,
  })),
);
const InventoryPage = lazy(() =>
  import('@/modules/inventory/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const OrdersListPage = lazy(() =>
  import('@/modules/orders/pages/OrdersListPage').then((m) => ({ default: m.OrdersListPage })),
);
const FinancePage = lazy(() =>
  import('@/modules/finance/pages/FinancePage').then((m) => ({ default: m.FinancePage })),
);
const ReportsPage = lazy(() =>
  import('@/modules/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const UsersListPage = lazy(() =>
  import('@/modules/users/pages/UsersListPage').then((m) => ({ default: m.UsersListPage })),
);
const RolesListPage = lazy(() =>
  import('@/modules/roles/pages/RolesListPage').then((m) => ({ default: m.RolesListPage })),
);
const SettingsPage = lazy(() =>
  import('@/modules/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

const lazyLoad = (Component) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),

    children: [
      { index: true, element: <Navigate to={ROUTES.LOGIN} replace /> },
      { path: 'login', element: lazyLoad(LoginPage) },
      { path: 'signup', element: lazyLoad(SignupPage) },
      { path: 'recover', element: lazyLoad(RecoverPage) },
    ],
  },
  {
    path: '/reset-password',
    element: <AuthLayout />,
    children: [{ index: true, element: lazyLoad(ResetPasswordPage) }],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),

    children: [
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.DASHBOARD_READ]}>
            {lazyLoad(DashboardPage)}
          </ProtectedRoute>
        ),

        handle: { breadcrumb: 'Dashboard' },
      },
      {
        path: ROUTES.CUSTOMERS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.CUSTOMERS_READ]}>
            {lazyLoad(CustomersListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPPLIERS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.SUPPLIERS_READ]}>
            {lazyLoad(SuppliersListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PRODUCTS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_READ]}>
            {lazyLoad(ProductsListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.INVENTORY,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.INVENTORY_READ]}>
            {lazyLoad(InventoryPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ORDERS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.ORDERS_READ]}>
            {lazyLoad(OrdersListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FINANCE,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.FINANCE_READ]}>
            {lazyLoad(FinancePage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.REPORTS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_READ]}>
            {lazyLoad(ReportsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USERS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.USERS_READ]}>
            {lazyLoad(UsersListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ROLES,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.ROLES_READ]}>
            {lazyLoad(RolesListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.SETTINGS_READ]}>
            {lazyLoad(SettingsPage)}
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
