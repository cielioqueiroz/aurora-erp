import { z } from 'zod';

export const financeSchema = z.object({
  type: z.enum(['payable', 'receivable']),
  category: z.string().max(80).optional().or(z.literal('')),
  description: z.string().min(2, 'Descrição obrigatória'),
  amount: z.coerce.number().positive('Valor inválido'),
  due_date: z.string().min(1, 'Data obrigatória'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
});
