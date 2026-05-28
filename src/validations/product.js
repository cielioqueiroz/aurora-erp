import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().max(40).optional().or(z.literal('')),
  barcode: z.string().max(40).optional().or(z.literal('')),
  name: z.string().min(2, 'Informe o nome do produto'),
  description: z.string().max(2000).optional().or(z.literal('')),
  category_id: z.string().uuid('Categoria inválida').optional().or(z.literal('')).nullable(),
  unit: z.string().min(1, 'Unidade obrigatória').default('un'),
  price: z.coerce.number().min(0, 'Preço inválido'),
  cost: z.coerce.number().min(0, 'Custo inválido').default(0),
  stock_min: z.coerce.number().min(0, 'Mínimo inválido').default(0),
  is_active: z.boolean().default(true),
  images: z.array(z.string().url()).default([]),
});
