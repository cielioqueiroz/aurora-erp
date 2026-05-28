export const SYSTEM_ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
});

export const SYSTEM_ROLE_LABELS = {
  [SYSTEM_ROLES.OWNER]: 'Proprietário',
  [SYSTEM_ROLES.ADMIN]: 'Administrador',
  [SYSTEM_ROLES.MANAGER]: 'Gerente',
  [SYSTEM_ROLES.OPERATOR]: 'Operador',
  [SYSTEM_ROLES.VIEWER]: 'Visualizador',
};
