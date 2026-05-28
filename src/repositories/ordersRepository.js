import { createRepository } from './baseRepository';
import {
  demoOrders,
  demoOrderItems,
  demoPayments,
  demoCustomers,
  applyMutation,
} from '@/app/demoFixtures';
import { isDemoMode } from '@/app/demoMode';
import { supabase } from '@/integrations/supabase/client';
import { unwrap } from '@/integrations/supabase/errors';

const baseRepo = createRepository('orders', { demoStore: demoOrders });

/** Lista pedidos com nome do cliente já resolvido. */
async function listWithCustomer(params = {}) {
  if (isDemoMode) {
    const result = await baseRepo.list(params);
    const customerById = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));
    const data = result.data.map((o) => ({
      ...o,
      customer: customerById[o.customer_id] ?? null,
      customer_name: customerById[o.customer_id]?.name ?? '—',
    }));
    return { ...result, data };
  }

  // Supabase: join inline
  const { page = 1, perPage = 20, order = { field: 'created_at', asc: false }, search } = params;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let q = supabase
    .from('orders')
    .select('*, customer:customer_id(id, name, document, email)', { count: 'exact' })
    .is('deleted_at', null);
  if (search?.trim()) q = q.ilike('code', `%${search.trim()}%`);
  if (order?.field) q = q.order(order.field, { ascending: !!order.asc });
  q = q.range(from, to);
  const { data, error, count } = await q;
  if (error) throw error;
  return {
    data: (data ?? []).map((o) => ({ ...o, customer_name: o.customer?.name ?? '—' })),
    count: count ?? 0,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  };
}

async function getDetail(orderId) {
  if (isDemoMode) {
    const order = applyMutation(demoOrders, 'getById', orderId);
    if (!order) return null;
    const customer = demoCustomers.find((c) => c.id === order.customer_id) ?? null;
    const items = demoOrderItems.filter((i) => i.order_id === orderId);
    const payments = demoPayments.filter((p) => p.order_id === orderId);
    return { ...order, customer, items, payments };
  }
  const order = unwrap(
    await supabase
      .from('orders')
      .select('*, customer:customer_id(*)')
      .eq('id', orderId)
      .maybeSingle(),
  );
  if (!order) return null;
  const items = unwrap(
    await supabase
      .from('order_items')
      .select('*, product:product_id(*)')
      .eq('order_id', orderId),
  );
  const payments = unwrap(await supabase.from('payments').select('*').eq('order_id', orderId));
  return { ...order, items: items ?? [], payments: payments ?? [] };
}

export const ordersRepository = {
  ...baseRepo,
  list: listWithCustomer,
  getDetail,
};
