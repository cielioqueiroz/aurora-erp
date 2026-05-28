import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const NUMBER_BR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const INTEGER_BR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const PERCENT_BR = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formata valor numérico como moeda BRL.
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
export function formatCurrency(value) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (num == null || Number.isNaN(num)) return BRL.format(0);
  return BRL.format(num);
}

/** Formata um número com separadores BR (ex: 1.234,56). */
export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '0';
  return NUMBER_BR.format(value);
}

/** Formata um número inteiro com separadores BR. */
export function formatInteger(value) {
  if (value == null || Number.isNaN(value)) return '0';
  return INTEGER_BR.format(value);
}

/** Formata percentual (0.1234 -> 12,3%). */
export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '0%';
  return PERCENT_BR.format(value);
}

/** Formata data dd/MM/yyyy. */
export function formatDate(value, fmt = 'dd/MM/yyyy') {
  const date = value instanceof Date ? value : parseISO(String(value));
  if (!isValid(date)) return '—';
  return format(date, fmt, { locale: ptBR });
}

/** Formata data + hora dd/MM/yyyy HH:mm. */
export function formatDateTime(value) {
  return formatDate(value, 'dd/MM/yyyy HH:mm');
}

/** Distância humanizada ("há 3 minutos"). */
export function formatRelative(value) {
  const date = value instanceof Date ? value : parseISO(String(value));
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}

/** Formata CPF (11 dígitos -> 000.000.000-00). */
export function formatCPF(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/** Formata CNPJ (14 dígitos -> 00.000.000/0000-00). */
export function formatCNPJ(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** Detecta tipo (CPF/CNPJ) e formata. */
export function formatDocument(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length <= 11) return formatCPF(digits);
  return formatCNPJ(digits);
}

/** Formata telefone BR (10 ou 11 dígitos). */
export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  }
  return digits.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

/** Formata CEP (00000-000). */
export function formatCEP(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

/** Reduz string a iniciais (até 2 chars, uppercase). */
export function getInitials(name) {
  if (!name) return '—';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Trunca texto adicionando reticências. */
export function truncate(text, max = 60) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
