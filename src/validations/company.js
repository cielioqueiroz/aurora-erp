import { z } from 'zod';
import { isValidCNPJ, isValidPhone } from './br';

const optionalNullable = (validator, message) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || validator(v), message);

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Razão social obrigatória')
    .max(120, 'Razão social deve ter no máximo 120 caracteres'),
  document: optionalNullable(isValidCNPJ, 'CNPJ inválido'),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido'),
  phone: optionalNullable(isValidPhone, 'Telefone inválido'),
});
