import { describe, expect, it } from 'vitest';
import {
  formatCEP,
  formatCNPJ,
  formatCPF,
  formatCurrency,
  formatDocument,
  formatInteger,
  formatPhone,
  getInitials,
  truncate,
} from './formatters';

describe('formatCurrency', () => {
  it('formata BRL com 2 casas', () => {
    expect(formatCurrency(1234.5)).toMatch(/R\$\s*1\.234,50/);
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
  });

  it('lida com null/NaN', () => {
    expect(formatCurrency(null)).toMatch(/R\$\s*0,00/);
    expect(formatCurrency(undefined)).toMatch(/R\$\s*0,00/);
  });
});

describe('formatInteger', () => {
  it('aplica separadores BR', () => {
    expect(formatInteger(1000)).toBe('1.000');
    expect(formatInteger(1234567)).toBe('1.234.567');
  });
});

describe('formatCPF', () => {
  it('formata 11 dígitos', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });
});

describe('formatCNPJ', () => {
  it('formata 14 dígitos', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('formatDocument', () => {
  it('detecta CPF vs CNPJ', () => {
    expect(formatDocument('52998224725')).toBe('529.982.247-25');
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('formatPhone', () => {
  it('fixo (10) e celular (11)', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });
});

describe('formatCEP', () => {
  it('formata 8 dígitos', () => {
    expect(formatCEP('01310100')).toBe('01310-100');
  });
});

describe('getInitials', () => {
  it('extrai iniciais', () => {
    expect(getInitials('João Silva')).toBe('JS');
    expect(getInitials('Aurora')).toBe('AU');
    expect(getInitials(null)).toBe('—');
  });
});

describe('truncate', () => {
  it('adiciona reticências', () => {
    expect(truncate('abcdef', 4)).toBe('abcd…');
    expect(truncate('abc', 4)).toBe('abc');
  });
});
