const PG_ERROR_MAP = {
  23505: 'Já existe um registro com estes dados.',
  23503: 'Operação não permitida: registro relacionado em uso.',
  23502: 'Campo obrigatório não preenchido.',
  42501: 'Você não tem permissão para esta operação.',
  '22P02': 'Formato inválido em um dos campos.',
};

const AUTH_ERROR_MAP = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'New password should be different from the old password':
    'A nova senha deve ser diferente da atual.',
};

export class AppError extends Error {
  constructor(message, { cause, code } = {}) {
    super(message);
    this.name = 'AppError';
    this.cause = cause;
    this.code = code;
  }
}

export function toAppError(error, fallback = 'Algo deu errado. Tente novamente.') {
  if (!error) return new AppError(fallback);
  if (error instanceof AppError) return error;

  const pgCode = error.code;
  if (pgCode && PG_ERROR_MAP[pgCode]) {
    return new AppError(PG_ERROR_MAP[pgCode], { cause: error, code: pgCode });
  }

  const msg = error.message ?? '';
  if (AUTH_ERROR_MAP[msg]) {
    return new AppError(AUTH_ERROR_MAP[msg], { cause: error });
  }

  return new AppError(msg || fallback, { cause: error, code: pgCode });
}

export function unwrap({ data, error }, fallback) {
  if (error) throw toAppError(error, fallback);
  return data;
}
