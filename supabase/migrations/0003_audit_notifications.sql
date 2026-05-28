-- =============================================================================
-- AURORA ERP — 0003 — Audit logs & Notifications
-- =============================================================================

-- ---------------------------------------------------------------------------
-- AUDIT_LOGS — registro imutável de eventos
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,              -- ex: 'customer.create', 'order.cancel'
  entity      text not null,              -- ex: 'customers'
  entity_id   uuid,
  diff        jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_company_created_idx
  on public.audit_logs (company_id, created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs (company_id, entity, entity_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_company"
  on public.audit_logs for select
  using (company_id = public.current_company_id());

-- Insert apenas via service_role / RPC (trigger interno). Bloqueia client direto.
create policy "audit_logs_no_client_insert"
  on public.audit_logs for insert
  with check (false);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS — por usuário, escopo de company
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  type        text not null default 'info'
                check (type in ('info','success','warning','danger')),
  title       text not null,
  message     text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid() and company_id = public.current_company_id());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

-- Insert via service_role/trigger (não pelo client direto)
create policy "notifications_no_client_insert"
  on public.notifications for insert
  with check (false);
