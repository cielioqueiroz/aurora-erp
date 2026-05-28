-- =============================================================================
-- AURORA ERP — 0001 — Multi-tenancy base
-- companies, profiles, user_companies, trigger de updated_at, soft delete helper
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helper: trigger function para manter updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- COMPANIES — cada tenant
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  document    text,                       -- CNPJ (apenas dígitos)
  email       text,
  phone       text,
  settings    jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create unique index if not exists companies_document_unique
  on public.companies (document)
  where document is not null and deleted_at is null;

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PROFILES — espelha auth.users com dados de aplicação
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  avatar_url          text,
  default_company_id  uuid references public.companies(id) on delete set null,
  preferences         jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- USER_COMPANIES — junção user × company com role
-- (role_id virá da migration 0002)
-- ---------------------------------------------------------------------------
create table if not exists public.user_companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role_id     uuid,                       -- preenchido após 0002
  status      text not null default 'active'
                check (status in ('active','suspended','invited','removed')),
  invited_by  uuid references auth.users(id) on delete set null,
  joined_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, company_id)
);

create index if not exists user_companies_user_idx on public.user_companies (user_id);
create index if not exists user_companies_company_idx on public.user_companies (company_id);

create trigger user_companies_set_updated_at
  before update on public.user_companies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — companies/profiles/user_companies
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_companies enable row level security;

-- companies: usuário só vê empresas das quais participa
create policy "companies_select_own"
  on public.companies for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = companies.id
        and uc.user_id = auth.uid()
        and uc.status = 'active'
    )
  );

-- companies: insert via função/RPC apenas (signup)
create policy "companies_insert_via_authenticated"
  on public.companies for insert
  to authenticated
  with check (true);

-- companies: update apenas membros (refinado em 0002 com permissão)
create policy "companies_update_member"
  on public.companies for update
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.company_id = companies.id
        and uc.user_id = auth.uid()
        and uc.status = 'active'
    )
  );

-- profiles: cada usuário lê/atualiza o próprio
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- user_companies: usuário enxerga seus próprios vínculos
create policy "user_companies_select_own"
  on public.user_companies for select
  using (user_id = auth.uid());

-- user_companies: insert via signup/convite (refinado em 0002)
create policy "user_companies_insert_self_or_invite"
  on public.user_companies for insert
  with check (
    user_id = auth.uid() or invited_by = auth.uid()
  );
