import { demoTeamMembers, demoRoles, applyMutation, paginateInMemory } from '@/app/demoFixtures';
import { isDemoMode } from '@/app/demoMode';
import { supabase } from '@/integrations/supabase/client';
import { unwrap } from '@/integrations/supabase/errors';

async function listTeamMembers(params = {}) {
  if (isDemoMode) {
    return paginateInMemory(demoTeamMembers, { ...params, searchField: 'full_name' });
  }

  const { data, error } = await supabase
    .from('user_companies')
    .select('user_id, status, joined_at, role:role_id(name, description)')
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return { data: data ?? [], count: data?.length ?? 0, page: 1, perPage: 100, totalPages: 1 };
}

async function listRoles() {
  if (isDemoMode) {
    return demoRoles;
  }
  const res = await supabase.from('roles').select('*').is('deleted_at', null).order('name');
  return unwrap(res) ?? [];
}

async function inviteMember({ email, role_id }) {
  if (isDemoMode) {
    return applyMutation(demoTeamMembers, 'create', {
      id: `user-${Math.random().toString(36).slice(2, 8)}`,
      full_name: email.split('@')[0],
      email,
      role_name: demoRoles.find((r) => r.id === role_id)?.name ?? 'viewer',
      status: 'invited',
      joined_at: new Date().toISOString(),
    });
  }

  throw new Error('Convite por e-mail requer Edge Function configurada.');
}

async function removeMember(userId) {
  if (isDemoMode) {
    const idx = demoTeamMembers.findIndex((m) => m.id === userId);
    if (idx >= 0) demoTeamMembers.splice(idx, 1);
    return { ok: true };
  }
  const { error } = await supabase
    .from('user_companies')
    .update({ status: 'removed' })
    .eq('user_id', userId);
  if (error) throw error;
  return { ok: true };
}

export const teamRepository = {
  listTeamMembers,
  listRoles,
  inviteMember,
  removeMember,
};
