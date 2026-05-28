import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  BarChart3,
  UserCog,
  Shield,
  Settings,
} from 'lucide-react';
import { PERMISSIONS } from './permissions';

/**
 * Catálogo de módulos para navegação.
 * `permission` é a permissão mínima de leitura.
 */
export const NAV_MODULES = [
  {
    group: 'Visão geral',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_READ,
      },
    ],
  },
  {
    group: 'Comercial',
    items: [
      {
        key: 'customers',
        label: 'Clientes',
        href: '/customers',
        icon: Users,
        permission: PERMISSIONS.CUSTOMERS_READ,
      },
      {
        key: 'orders',
        label: 'Pedidos',
        href: '/orders',
        icon: ShoppingCart,
        permission: PERMISSIONS.ORDERS_READ,
      },
    ],
  },
  {
    group: 'Operação',
    items: [
      {
        key: 'products',
        label: 'Produtos',
        href: '/products',
        icon: Package,
        permission: PERMISSIONS.PRODUCTS_READ,
      },
      {
        key: 'inventory',
        label: 'Estoque',
        href: '/inventory',
        icon: Boxes,
        permission: PERMISSIONS.INVENTORY_READ,
      },
      {
        key: 'suppliers',
        label: 'Fornecedores',
        href: '/suppliers',
        icon: Building2,
        permission: PERMISSIONS.SUPPLIERS_READ,
      },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      {
        key: 'finance',
        label: 'Financeiro',
        href: '/finance',
        icon: Wallet,
        permission: PERMISSIONS.FINANCE_READ,
      },
      {
        key: 'reports',
        label: 'Relatórios',
        href: '/reports',
        icon: BarChart3,
        permission: PERMISSIONS.REPORTS_READ,
      },
    ],
  },
  {
    group: 'Administração',
    items: [
      {
        key: 'users',
        label: 'Usuários',
        href: '/users',
        icon: UserCog,
        permission: PERMISSIONS.USERS_READ,
      },
      {
        key: 'roles',
        label: 'Papéis',
        href: '/roles',
        icon: Shield,
        permission: PERMISSIONS.ROLES_READ,
      },
      {
        key: 'settings',
        label: 'Configurações',
        href: '/settings',
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_READ,
      },
    ],
  },
];
