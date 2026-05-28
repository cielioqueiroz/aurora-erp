-- =============================================================================
-- AURORA ERP — 0005 — RPC: criar empresa no signup e vincular o usuário como owner
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RPC: create_company_with_owner
-- Cria uma nova company, associa o usuário autenticado como owner
-- e ajusta app_metadata.current_company_id.
-- ---------------------------------------------------------------------------
create or replace function public.create_company_with_owner(
  p_name      text,
  p_document  text default null,
  p_email     text default null,
  p_phone     text default null
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company public.companies;
  owner_role_id uuid := '00000000-0000-0000-0000-000000000001';
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.companies (name, document, email, phone)
  values (p_name, p_document, p_email, p_phone)
  returning * into new_company;

  insert into public.user_companies (user_id, company_id, role_id, status)
  values (v_user_id, new_company.id, owner_role_id, 'active');

  update public.profiles
     set default_company_id = new_company.id
   where id = v_user_id
     and default_company_id is null;

  -- Define a empresa ativa no app_metadata do usuário
  update auth.users
     set raw_app_meta_data =
         coalesce(raw_app_meta_data, '{}'::jsonb)
         || jsonb_build_object('current_company_id', new_company.id::text)
   where id = v_user_id;

  return new_company;
end;
$$;

revoke all on function public.create_company_with_owner(text, text, text, text)
  from public, anon;
grant execute on function public.create_company_with_owner(text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: switch_active_company
-- Altera a empresa ativa do usuário (se ele for membro).
-- ---------------------------------------------------------------------------
create or replace function public.switch_active_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_member boolean;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select exists (
    select 1 from public.user_companies uc
     where uc.user_id = v_user_id
       and uc.company_id = p_company_id
       and uc.status = 'active'
  ) into v_is_member;

  if not v_is_member then
    raise exception 'Usuário não pertence a esta empresa';
  end if;

  update auth.users
     set raw_app_meta_data =
         coalesce(raw_app_meta_data, '{}'::jsonb)
         || jsonb_build_object('current_company_id', p_company_id::text)
   where id = v_user_id;
end;
$$;

revoke all on function public.switch_active_company(uuid) from public, anon;
grant execute on function public.switch_active_company(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- VIEW: my_companies — lista as empresas do usuário com nome do role
-- ---------------------------------------------------------------------------
create or replace view public.my_companies as
select
  c.id,
  c.name,
  c.document,
  c.email,
  c.phone,
  c.settings,
  c.is_active,
  uc.role_id,
  r.name as role_name,
  uc.status,
  uc.joined_at
from public.companies c
join public.user_companies uc on uc.company_id = c.id
join public.roles r on r.id = uc.role_id
where uc.user_id = auth.uid()
  and uc.status = 'active'
  and c.deleted_at is null;

grant select on public.my_companies to authenticated;

-- ---------------------------------------------------------------------------
-- VIEW: my_permissions — todas as permissions do usuário na company ativa
-- ---------------------------------------------------------------------------
create or replace view public.my_permissions as
select distinct p.key
  from public.user_companies uc
  join public.role_permissions rp on rp.role_id = uc.role_id
  join public.permissions p       on p.id = rp.permission_id
 where uc.user_id = auth.uid()
   and uc.company_id = public.current_company_id()
   and uc.status = 'active';

grant select on public.my_permissions to authenticated;
