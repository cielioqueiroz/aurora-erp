import { describe, it, expect } from 'vitest';
import { companySchema } from './company';

const validCNPJ = '11.222.333/0001-81';

describe('companySchema', () => {
  it('aceita payload mínimo (só name)', () => {
    const result = companySchema.parse({ name: 'Nexus LTDA' });
    expect(result.name).toBe('Nexus LTDA');
    expect(result.document).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });

  it('rejeita name vazio', () => {
    expect(() => companySchema.parse({ name: '' })).toThrow(/Razão social/);
  });

  it('faz trim do name', () => {
    const result = companySchema.parse({ name: '  Nexus LTDA  ' });
    expect(result.name).toBe('Nexus LTDA');
  });

  it('aceita CNPJ válido', () => {
    const result = companySchema.parse({ name: 'Nexus', document: validCNPJ });
    expect(result.document).toBe(validCNPJ);
  });

  it('converte CNPJ vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', document: '' });
    expect(result.document).toBeNull();
  });

  it('rejeita CNPJ inválido', () => {
    expect(() => companySchema.parse({ name: 'Nexus', document: '11.111.111/1111-11' })).toThrow(
      /CNPJ inválido/,
    );
  });

  it('rejeita email malformado', () => {
    expect(() => companySchema.parse({ name: 'Nexus', email: 'nao-eh-email' })).toThrow(
      /E-mail inválido/,
    );
  });

  it('converte email vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', email: '' });
    expect(result.email).toBeNull();
  });

  it('aceita telefone válido', () => {
    const result = companySchema.parse({ name: 'Nexus', phone: '(11) 99999-9999' });
    expect(result.phone).toBe('(11) 99999-9999');
  });

  it('rejeita telefone inválido', () => {
    expect(() => companySchema.parse({ name: 'Nexus', phone: '123' })).toThrow(/Telefone inválido/);
  });

  it('converte telefone vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', phone: '' });
    expect(result.phone).toBeNull();
  });
});
