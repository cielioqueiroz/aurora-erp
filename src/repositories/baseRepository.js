import { supabase } from '@/integrations/supabase/client';
import { unwrap } from '@/integrations/supabase/errors';
import { isDemoMode } from '@/app/demoMode';
import { applyMutation, paginateInMemory } from '@/app/demoFixtures';

/**
 * BaseRepository — abstração CRUD genérica sobre Supabase + suporte a modo demo.
 *
 * - Em produção/dev real: usa o cliente Supabase. RLS isola por company_id.
 * - Em modo demo (VITE_DEMO_MODE=true): opera contra um array fixture em memória.
 *
 * Convenções:
 *  - Soft delete via update `deleted_at = now()`.
 *  - Listagens padrão filtram `deleted_at is null`.
 */
export function createRepository(tableName, { softDelete = true, demoStore } = {}) {
  const baseSelect = '*';

  async function list({
    filters = {},
    search,
    searchField = 'name',
    order = { field: 'created_at', asc: false },
    page = 1,
    perPage = 20,
    select = baseSelect,
  } = {}) {
    if (isDemoMode && demoStore) {
      return paginateInMemory(demoStore, { filters, search, searchField, order, page, perPage });
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = supabase.from(tableName).select(select, { count: 'exact' });
    if (softDelete) q = q.is('deleted_at', null);

    for (const [field, value] of Object.entries(filters)) {
      if (value == null || value === '') continue;
      if (typeof value === 'object' && 'op' in value) {
        q = q[value.op](field, value.value);
      } else {
        q = q.eq(field, value);
      }
    }

    if (search && search.trim()) q = q.ilike(searchField, `%${search.trim()}%`);
    if (order?.field) q = q.order(order.field, { ascending: !!order.asc });
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      data: data ?? [],
      count: count ?? 0,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
    };
  }

  async function getById(id, { select = baseSelect } = {}) {
    if (isDemoMode && demoStore) {
      return applyMutation(demoStore, 'getById', id);
    }
    const res = await supabase.from(tableName).select(select).eq('id', id).maybeSingle();
    return unwrap(res);
  }

  async function create(payload) {
    if (isDemoMode && demoStore) {
      return applyMutation(demoStore, 'create', payload);
    }
    const res = await supabase.from(tableName).insert(payload).select().single();
    return unwrap(res);
  }

  async function update(id, payload) {
    if (isDemoMode && demoStore) {
      return applyMutation(demoStore, 'update', { id, ...payload });
    }
    const res = await supabase.from(tableName).update(payload).eq('id', id).select().single();
    return unwrap(res);
  }

  async function remove(id) {
    if (isDemoMode && demoStore) {
      return applyMutation(demoStore, 'remove', id);
    }
    if (softDelete) {
      const res = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      return unwrap(res);
    }
    const res = await supabase.from(tableName).delete().eq('id', id);
    return unwrap(res);
  }

  return { tableName, list, getById, create, update, remove };
}
