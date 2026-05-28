/** Remove tudo que não for dígito (para CPF, CNPJ, fone, CEP). */
export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Converte string "1.234,56" para número 1234.56. */
export function parseBRL(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}
