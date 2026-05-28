import { z } from 'zod';
import { isValidCNPJ } from './br';
import { onlyDigits } from '@/lib/parsers';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'Senha precisa ter ao menos 6 caracteres'),
});

export const recoverSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
});

export const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Senha precisa ter ao menos 8 caracteres')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[0-9]/, 'Inclua um número'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  });

export const signupAccountSchema = z
  .object({
    fullName: z.string().min(3, 'Informe seu nome completo'),
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha precisa ter ao menos 8 caracteres')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[0-9]/, 'Inclua um número'),
    confirm: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Aceite os termos para continuar' }),
    }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  });

export const signupCompanySchema = z.object({
  name: z.string().min(2, 'Informe o nome da empresa'),
  document: z
    .string()
    .optional()
    .refine((v) => !v || onlyDigits(v).length === 14, 'CNPJ deve ter 14 dígitos')
    .refine((v) => !v || isValidCNPJ(v), 'CNPJ inválido'),
  phone: z.string().optional(),
});
