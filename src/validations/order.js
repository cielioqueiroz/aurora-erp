import { z } from 'zod';

export const PAYMENT_TERMS = [
  { value: '0', label: 'À vista' },
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
];

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'debit_card', label: 'Cartão de débito' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transfer', label: 'Transferência' },
];

export const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  discount: z.coerce.number().min(0, 'Desconto não pode ser negativo').default(0),
});

export const orderSchema = z
  .object({
    customer_id: z.string().nullable().default(null),
    items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item'),
    discount: z.coerce.number().min(0, 'Desconto não pode ser negativo').default(0),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    due_date: z.string().nullable().default(null),
  })
  .superRefine((value, ctx) => {
    const duplicated = value.items
      .map((item) => item.product_id)
      .filter((id, index, all) => all.indexOf(id) !== index);

    if (duplicated.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'O mesmo produto aparece mais de uma vez. Ajuste a quantidade da linha existente.',
      });
    }
  });

export function calculateItemTotal({ quantity, unitPrice, discount }) {
  const value = Number(quantity ?? 0) * Number(unitPrice ?? 0) - Number(discount ?? 0);
  return Math.round(value * 100) / 100;
}

export function calculateOrderTotals(items, orderDiscount) {
  const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const rounded = Math.round(subtotal * 100) / 100;
  return {
    subtotal: rounded,
    discount: Number(orderDiscount ?? 0),
    total: Math.round((rounded - Number(orderDiscount ?? 0)) * 100) / 100,
  };
}

export function dueDateFromTerm(term) {
  const days = Number(term ?? 0);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
