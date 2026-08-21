import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { NotFoundPage } from '@/modules/_shared/NotFoundPage';

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
const OrderFormPage = lazy(() =>
  import('@/modules/orders/pages/OrderFormPage').then((m) => ({ default: m.OrderFormPage })),
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

const toDashboard = <Navigate to={ROUTES.DASHBOARD} replace />;

export const router = createBrowserRouter([
  { path: ROUTES.ROOT, element: toDashboard },
  { path: ROUTES.LOGIN, element: toDashboard },
  { path: ROUTES.SIGNUP, element: toDashboard },
  { path: ROUTES.RECOVER, element: toDashboard },
  { path: ROUTES.RESET, element: toDashboard },
  {
    element: <AppLayout />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: lazyLoad(DashboardPage),
        handle: { breadcrumb: 'Dashboard' },
      },
      { path: ROUTES.CUSTOMERS, element: lazyLoad(CustomersListPage) },
      { path: ROUTES.SUPPLIERS, element: lazyLoad(SuppliersListPage) },
      { path: ROUTES.PRODUCTS, element: lazyLoad(ProductsListPage) },
      { path: ROUTES.INVENTORY, element: lazyLoad(InventoryPage) },
      { path: ROUTES.ORDERS, element: lazyLoad(OrdersListPage) },
      { path: ROUTES.ORDER_NEW, element: lazyLoad(OrderFormPage) },
      { path: ROUTES.FINANCE, element: lazyLoad(FinancePage) },
      { path: ROUTES.REPORTS, element: lazyLoad(ReportsPage) },
      { path: ROUTES.USERS, element: lazyLoad(UsersListPage) },
      { path: ROUTES.ROLES, element: lazyLoad(RolesListPage) },
      { path: ROUTES.SETTINGS, element: lazyLoad(SettingsPage) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
