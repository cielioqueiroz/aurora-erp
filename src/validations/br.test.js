import { describe, expect, it } from 'vitest';
import { isValidCEP, isValidCNPJ, isValidCPF, isValidDocument, isValidPhone } from './br';

describe('isValidCPF', () => {
  it('aceita CPFs válidos', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejeita CPFs inválidos', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('aceita CNPJs válidos', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('rejeita CNPJs inválidos', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
  });
});

describe('isValidDocument', () => {
  it('autodeteta CPF e CNPJ', () => {
    expect(isValidDocument('52998224725')).toBe(true);
    expect(isValidDocument('11222333000181')).toBe(true);
    expect(isValidDocument('123')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('aceita fixo e celular', () => {
    expect(isValidPhone('1133334444')).toBe(true);
    expect(isValidPhone('(11) 99999-9999')).toBe(true);
  });
  it('rejeita comprimento errado', () => {
    expect(isValidPhone('123')).toBe(false);
  });
});

describe('isValidCEP', () => {
  it('aceita 8 dígitos', () => {
    expect(isValidCEP('01310-100')).toBe(true);
    expect(isValidCEP('01310100')).toBe(true);
  });
  it('rejeita comprimento errado', () => {
    expect(isValidCEP('12345')).toBe(false);
  });
});
