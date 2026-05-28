import { z } from 'zod';
import { isValidDocument, isValidPhone } from './br';

export const customerSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  document: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined)
    .refine((v) => !v || isValidDocument(v), 'CPF ou CNPJ inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || isValidPhone(v), 'Telefone inválido'),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      state: z.string().length(2, 'UF deve ter 2 letras').optional().or(z.literal('')),
      zip: z.string().optional(),
    })
    .partial()
    .optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
});
