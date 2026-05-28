-- =============================================================================
-- AURORA ERP — 0002 — RBAC (roles, permissions) + helpers de RLS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PERMISSIONS — catálogo global (chave única <module>.<action>)
-- ---------------------------------------------------------------------------
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,         -- ex: 'customers.create'
  module      text not null,
  action      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists permissions_module_idx on public.permissions (module);

-- ---------------------------------------------------------------------------
-- ROLES — papéis (system_role globais OU específicos por company)
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid references public.companies(id) on delete cascade,
  name            text not null,
  description     text,
  is_system_role  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique nulls not distinct (company_id, name)
);

create index if not exists roles_company_idx on public.roles (company_id);

create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ROLE_PERMISSIONS — N:N
-- ---------------------------------------------------------------------------
create table if not exists public.role_permissions (
  role_id        uuid not null references public.roles(id) on delete cascade,
  permission_id  uuid not null references public.permissions(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index if not exists role_permissions_perm_idx
  on public.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- FK em user_companies.role_id após criação da tabela roles
-- ---------------------------------------------------------------------------
alter table public.user_companies
  add constraint user_companies_role_fk
  foreign key (role_id) references public.roles(id) on delete restrict
  not valid;

-- ---------------------------------------------------------------------------
-- Helper: company_id ativa no JWT (app_metadata.current_company_id)
-- Fallback: primeira company_id ativa do usuário.
-- ---------------------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim_value text;
  resolved uuid;
begin
  -- Tenta ler do JWT (app_metadata)
  begin
    claim_value := current_setting('request.jwt.claims', true)::jsonb
                   #>> '{app_metadata,current_company_id}';
  exception when others then
    claim_value := null;
  end;

  if claim_value is not null and claim_value <> '' then
    return claim_value::uuid;
  end if;

  -- Fallback: primeira empresa ativa do usuário
  select uc.company_id
    into resolved
    from public.user_companies uc
   where uc.user_id = auth.uid()
     and uc.status = 'active'
   order by uc.joined_at asc
   limit 1;

  return resolved;
end;
$$;

-- ---------------------------------------------------------------------------
-- Helper: o usuário possui a permissão informada na company ativa?
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.user_companies uc
      join public.role_permissions rp on rp.role_id = uc.role_id
      join public.permissions p       on p.id = rp.permission_id
     where uc.user_id = auth.uid()
       and uc.company_id = public.current_company_id()
       and uc.status = 'active'
       and p.key = p_key
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: o usuário pertence à company ativa? (atalho leve)
-- ---------------------------------------------------------------------------
create or replace function public.is_company_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_companies uc
     where uc.user_id = auth.uid()
       and uc.company_id = public.current_company_id()
       and uc.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS em permissions, roles, role_permissions
-- ---------------------------------------------------------------------------
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;

-- permissions: leitura para qualquer autenticado (catálogo global)
create policy "permissions_select_all_auth"
  on public.permissions for select to authenticated
  using (true);

-- roles: leitura de roles da company ativa OU system roles
create policy "roles_select_own_or_system"
  on public.roles for select
  using (
    is_system_role = true
    or company_id = public.current_company_id()
  );

create policy "roles_insert_with_permission"
  on public.roles for insert
  with check (
    company_id = public.current_company_id()
    and public.has_permission('roles.create')
  );

create policy "roles_update_with_permission"
  on public.roles for update
  using (
    company_id = public.current_company_id()
    and is_system_role = false
    and public.has_permission('roles.update')
  );

create policy "roles_delete_with_permission"
  on public.roles for delete
  using (
    company_id = public.current_company_id()
    and is_system_role = false
    and public.has_permission('roles.delete')
  );

-- role_permissions: leitura quando vê o role
create policy "role_permissions_select_visible"
  on public.role_permissions for select
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and (r.is_system_role or r.company_id = public.current_company_id())
    )
  );

create policy "role_permissions_write_with_permission"
  on public.role_permissions for all
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.company_id = public.current_company_id()
        and r.is_system_role = false
    )
    and public.has_permission('roles.update')
  )
  with check (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.company_id = public.current_company_id()
        and r.is_system_role = false
    )
    and public.has_permission('roles.update')
  );
