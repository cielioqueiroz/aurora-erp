import { onlyDigits } from '@/lib/parsers';

export function isValidCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let dv1 = (sum * 10) % 11;
  if (dv1 === 10) dv1 = 0;
  if (dv1 !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  let dv2 = (sum * 10) % 11;
  if (dv2 === 10) dv2 = 0;
  return dv2 === Number(cpf[10]);
}

export function isValidCNPJ(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (length) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cnpj[i]) * weights[i];
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const dv1 = calc(12);
  if (dv1 !== Number(cnpj[12])) return false;
  const dv2 = calc(13);
  return dv2 === Number(cnpj[13]);
}

export function isValidDocument(value) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);
  return false;
}

export function isValidPhone(value) {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function isValidCEP(value) {
  return onlyDigits(value).length === 8;
}
