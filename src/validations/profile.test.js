import { describe, it, expect } from 'vitest';
import { profileSchema } from './profile';

describe('profileSchema', () => {
  it('aceita nome válido com 2+ caracteres', () => {
    const result = profileSchema.parse({ full_name: 'Cielio' });
    expect(result.full_name).toBe('Cielio');
  });

  it('faz trim do nome', () => {
    const result = profileSchema.parse({ full_name: '   Cielio Queiroz   ' });
    expect(result.full_name).toBe('Cielio Queiroz');
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    expect(() => profileSchema.parse({ full_name: 'A' })).toThrow(
      /Nome deve ter ao menos 2 caracteres/,
    );
  });

  it('rejeita nome com mais de 80 caracteres', () => {
    const longName = 'x'.repeat(81);
    expect(() => profileSchema.parse({ full_name: longName })).toThrow();
  });
});
