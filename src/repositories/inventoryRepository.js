import { createRepository } from './baseRepository';
import { demoInventoryMovements, demoProducts } from '@/app/demoFixtures';
import { isDemoMode } from '@/app/demoMode';
import { supabase } from '@/integrations/supabase/client';

const baseRepo = createRepository('inventory_movements', {
  demoStore: demoInventoryMovements,
  softDelete: false,
});

/**
 * Saldo de estoque agregado por produto (in - out + adjust).
 * No Supabase real, idealmente isso vira uma view; aqui calculamos client-side
 * (em modo demo, ou via fallback até a view existir).
 */
async function getStockBalance() {
  if (isDemoMode) {
    const balance = {};
    for (const mov of demoInventoryMovements) {
      if (mov.deleted_at) continue;
      const sign = mov.type === 'in' ? 1 : mov.type === 'out' ? -1 : 0;
      const delta = mov.type === 'adjust' ? mov.quantity : sign * mov.quantity;
      balance[mov.product_id] = (balance[mov.product_id] ?? 0) + delta;
    }
    return demoProducts.map((p) => ({
      product: p,
      balance: balance[p.id] ?? 0,
      stock_min: p.stock_min,
    }));
  }

  // Em produção: agrega no SQL
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('product_id, type, quantity')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const balance = {};
  for (const mov of data ?? []) {
    const sign = mov.type === 'in' ? 1 : mov.type === 'out' ? -1 : 0;
    const delta = mov.type === 'adjust' ? mov.quantity : sign * mov.quantity;
    balance[mov.product_id] = (balance[mov.product_id] ?? 0) + Number(delta);
  }
  const { data: prods, error: pe } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null);
  if (pe) throw pe;
  return (prods ?? []).map((p) => ({
    product: p,
    balance: balance[p.id] ?? 0,
    stock_min: p.stock_min,
  }));
}

export const inventoryRepository = {
  ...baseRepo,
  getStockBalance,
};
