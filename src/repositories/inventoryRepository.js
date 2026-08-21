import { createRepository } from './baseRepository';
import { demoInventoryMovements, demoProducts, demoStockBalance } from '@/app/demoFixtures';
import { isDemoMode } from '@/app/demoMode';
import { supabase } from '@/integrations/supabase/client';

const baseRepo = createRepository('inventory_movements', {
  demoStore: demoInventoryMovements,
  softDelete: false,
});

async function getStockBalance() {
  if (isDemoMode) {
    return demoStockBalance().map((row) => ({
      product: demoProducts.find((p) => p.id === row.product_id) ?? null,
      balance: row.balance,
      stock_min: row.stock_min,
    }));
  }

  const { data, error } = await supabase
    .from('product_stock_balance')
    .select('*')
    .order('product_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    product: {
      id: row.product_id,
      name: row.product_name,
      sku: row.sku,
      price: row.price,
      stock_min: row.stock_min,
    },
    balance: Number(row.balance),
    stock_min: row.stock_min,
  }));
}

async function listSellableProducts() {
  if (isDemoMode) {
    return demoStockBalance()
      .filter((row) => demoProducts.find((p) => p.id === row.product_id)?.is_active)
      .map((row) => ({ ...row, balance: Number(row.balance) }));
  }

  const { data, error } = await supabase
    .from('product_stock_balance')
    .select('*')
    .eq('is_active', true)
    .order('product_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, balance: Number(row.balance) }));
}

export const inventoryRepository = {
  ...baseRepo,
  getStockBalance,
  listSellableProducts,
};
