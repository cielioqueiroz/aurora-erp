import { ALL_PERMISSIONS } from '@/constants/permissions';

/**
 * Modo demo — quando ligado via VITE_DEMO_MODE=true, o app:
 *  - pula bootstrap do Supabase
 *  - injeta sessão/usuário/empresa/permissions fake no authStore
 *  - permite navegar todas as telas sem precisar fazer signup
 *
 * Útil para apresentação visual / preview de UI sem backend real.
 * NUNCA habilite em produção.
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_COMPANY_ID = '00000000-aaaa-aaaa-aaaa-000000000001';
const DEMO_USER_ID = '00000000-bbbb-bbbb-bbbb-000000000001';

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@auroraerp.local',
  user_metadata: {
    full_name: 'Visitante Demo',
    avatar_url: null,
  },
  app_metadata: {
    current_company_id: DEMO_COMPANY_ID,
  },
};

export const DEMO_SESSION = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
};

export const DEMO_COMPANIES = [
  {
    id: DEMO_COMPANY_ID,
    name: 'Aurora Demo Ltda',
    document: '11222333000181',
    email: 'contato@auroraerp.local',
    phone: '11999998888',
    settings: {},
    is_active: true,
    role_id: '00000000-0000-0000-0000-000000000001',
    role_name: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  },
];

export const DEMO_PERMISSIONS = ALL_PERMISSIONS;

export const DEMO_STATE = {
  status: 'authenticated',
  session: DEMO_SESSION,
  user: DEMO_USER,
  companies: DEMO_COMPANIES,
  currentCompanyId: DEMO_COMPANY_ID,
  permissions: DEMO_PERMISSIONS,
};
