-- =============================================================================
-- AURORA ERP — 0006 — Security hardening (search_path, grants, RLS cleanup)
-- =============================================================================

-- Trigger function set_updated_at: imutável search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user é uma função de trigger; não deve ser invocável via REST
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Helpers de RLS: revogar EXECUTE de anon (apenas usuários autenticados invocam)
revoke execute on function public.current_company_id() from public, anon;
revoke execute on function public.has_permission(text) from public, anon;
revoke execute on function public.is_company_member() from public, anon;

-- Empresas só podem ser criadas via RPC create_company_with_owner (SECURITY DEFINER).
-- A policy abaixo era permissiva demais e foi substituída.
drop policy if exists "companies_insert_via_authenticated" on public.companies;
