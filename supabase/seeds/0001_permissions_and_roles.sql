-- =============================================================================
-- AURORA ERP — Seed: permissions catalog + system roles
-- Idempotente: pode ser reaplicado.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PERMISSIONS — catálogo
-- ---------------------------------------------------------------------------
insert into public.permissions (key, module, action, description) values
  ('dashboard.read',   'dashboard', 'read',   'Visualizar dashboard'),

  ('customers.read',   'customers', 'read',   'Visualizar clientes'),
  ('customers.create', 'customers', 'create', 'Criar clientes'),
  ('customers.update', 'customers', 'update', 'Editar clientes'),
  ('customers.delete', 'customers', 'delete', 'Excluir clientes'),

  ('suppliers.read',   'suppliers', 'read',   'Visualizar fornecedores'),
  ('suppliers.create', 'suppliers', 'create', 'Criar fornecedores'),
  ('suppliers.update', 'suppliers', 'update', 'Editar fornecedores'),
  ('suppliers.delete', 'suppliers', 'delete', 'Excluir fornecedores'),

  ('products.read',    'products',  'read',   'Visualizar produtos'),
  ('products.create',  'products',  'create', 'Criar produtos'),
  ('products.update',  'products',  'update', 'Editar produtos'),
  ('products.delete',  'products',  'delete', 'Excluir produtos'),

  ('inventory.read',   'inventory', 'read',   'Visualizar estoque'),
  ('inventory.move',   'inventory', 'move',   'Movimentar estoque'),
  ('inventory.adjust', 'inventory', 'adjust', 'Ajustar estoque'),

  ('orders.read',      'orders',    'read',   'Visualizar pedidos'),
  ('orders.create',    'orders',    'create', 'Criar pedidos'),
  ('orders.update',    'orders',    'update', 'Editar pedidos'),
  ('orders.cancel',    'orders',    'cancel', 'Cancelar pedidos'),
  ('orders.refund',    'orders',    'refund', 'Reembolsar pedidos'),

  ('finance.read',     'finance',   'read',   'Visualizar financeiro'),
  ('finance.create',   'finance',   'create', 'Criar lançamento financeiro'),
  ('finance.update',   'finance',   'update', 'Editar lançamento financeiro'),
  ('finance.delete',   'finance',   'delete', 'Excluir lançamento financeiro'),

  ('reports.read',     'reports',   'read',   'Visualizar relatórios'),
  ('reports.export',   'reports',   'export', 'Exportar relatórios'),

  ('users.read',       'users',     'read',   'Visualizar usuários'),
  ('users.invite',     'users',     'invite', 'Convidar usuários'),
  ('users.update',     'users',     'update', 'Editar usuários'),
  ('users.remove',     'users',     'remove', 'Remover usuários'),

  ('roles.read',       'roles',     'read',   'Visualizar papéis'),
  ('roles.create',     'roles',     'create', 'Criar papéis'),
  ('roles.update',     'roles',     'update', 'Editar papéis'),
  ('roles.delete',     'roles',     'delete', 'Excluir papéis'),

  ('settings.read',    'settings',  'read',   'Visualizar configurações'),
  ('settings.update',  'settings',  'update', 'Editar configurações')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- ROLES — system roles (company_id null, is_system_role true)
-- ---------------------------------------------------------------------------
insert into public.roles (id, company_id, name, description, is_system_role) values
  ('00000000-0000-0000-0000-000000000001', null, 'owner',    'Proprietário (todas as permissões, indestrutível)', true),
  ('00000000-0000-0000-0000-000000000002', null, 'admin',    'Administrador (gestão completa)', true),
  ('00000000-0000-0000-0000-000000000003', null, 'manager',  'Gerente (operações sem settings/roles)', true),
  ('00000000-0000-0000-0000-000000000004', null, 'operator', 'Operador (vendas e estoque)', true),
  ('00000000-0000-0000-0000-000000000005', null, 'viewer',   'Visualizador (apenas leitura)', true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- ROLE_PERMISSIONS — atribuições
-- ---------------------------------------------------------------------------

-- OWNER: todas as permissões
insert into public.role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000001'::uuid, p.id
  from public.permissions p
on conflict do nothing;

-- ADMIN: todas exceto roles.delete (preserva sistema; apenas owner remove papéis)
insert into public.role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000002'::uuid, p.id
  from public.permissions p
 where p.key not in ('roles.delete')
on conflict do nothing;

-- MANAGER: leitura/escrita operacional, sem roles, sem settings.update
insert into public.role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000003'::uuid, p.id
  from public.permissions p
 where p.module in ('dashboard','customers','suppliers','products','inventory','orders','finance','reports','users')
   and p.key not in ('users.remove')
on conflict do nothing;

-- OPERATOR: pedidos + estoque + leitura de clientes/produtos
insert into public.role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000004'::uuid, p.id
  from public.permissions p
 where p.key in (
    'dashboard.read',
    'customers.read','customers.create','customers.update',
    'products.read',
    'inventory.read','inventory.move',
    'orders.read','orders.create','orders.update'
 )
on conflict do nothing;

-- VIEWER: somente leitura
insert into public.role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000005'::uuid, p.id
  from public.permissions p
 where p.action = 'read'
on conflict do nothing;
