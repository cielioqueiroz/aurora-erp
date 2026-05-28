import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. ' +
      'O sistema rodará em modo offline (auth/data falharão até configurar .env).',
  );
}

/**
 * Client Supabase singleton.
 * NUNCA importar isto diretamente em componentes — passe sempre por um repository.
 */
export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'aurora-erp.auth',
  },
  global: {
    headers: {
      'x-application-name': 'aurora-erp',
    },
  },
});

export const isSupabaseConfigured = Boolean(url && key);
