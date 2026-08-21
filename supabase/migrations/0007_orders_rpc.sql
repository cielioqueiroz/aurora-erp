-- =============================================================================
-- AURORA ERP — 0007 — Pedidos: numeração, saldo de estoque e RPCs transacionais
--
-- Decisões registradas em:
--   docs/adr/0001 — confirmar é o commit do pedido
--   docs/adr/0002 — pedido é criado por RPC transacional, não pelo repositório
--   docs/adr/0003 — payments e receivables respondem perguntas diferentes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ORDER_COUNTERS — numeração sequencial por empresa e por ano
-- Travada dentro da transação pelo on conflict do upsert. Não usar max(code)+1,
-- que colide sob concorrência.
-- ---------------------------------------------------------------------------
create table if not exists public.order_counters (
  company_id  uuid not null references public.companies(id) on delete cascade,
  year        integer not null,
  last_number integer not null default 0,
  primary key (company_id, year)
);

alter table public.order_counters enable row level security;

revoke all on table public.order_counters from anon, authenticated;

-- ---------------------------------------------------------------------------
-- PRODUCT_STOCK_BALANCE — saldo derivado das movimentações
-- Existe porque as RPCs precisam validar saldo dentro da transação, e porque
-- somar as movimentações no cliente trunca em 1000 linhas no PostgREST.
-- security_invoker mantém valendo a RLS de products e inventory_movements.
-- ---------------------------------------------------------------------------
create or replace view public.product_stock_balance
with (security_invoker = true) as
  select
    p.id         as product_id,
    p.company_id as company_id,
    p.name       as product_name,
    p.sku        as sku,
    p.price      as price,
    p.stock_min  as stock_min,
    coalesce(sum(
      case m.type
        when 'in'     then m.quantity
        when 'out'    then -m.quantity
        when 'adjust' then m.quantity
      end
    ), 0)::numeric(14, 3) as balance,
    p.is_active  as is_active
  from public.products p
  left join public.inventory_movements m on m.product_id = p.id
  where p.deleted_at is null
  group by p.id, p.company_id, p.name, p.sku, p.price, p.stock_min, p.is_active;

grant select on public.product_stock_balance to authenticated;

-- ---------------------------------------------------------------------------
-- Helper interno: próximo código do pedido no formato PED-YYYY-NNNNNN
-- ---------------------------------------------------------------------------
create or replace function public.next_order_code(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_year integer := extract(year from now())::integer;
  v_number integer;
begin
  insert into public.order_counters (company_id, year, last_number)
  values (p_company_id, v_year, 1)
  on conflict (company_id, year)
    do update set last_number = public.order_counters.last_number + 1
  returning last_number into v_number;

  return 'PED-' || v_year::text || '-' || lpad(v_number::text, 6, '0');
end;
$fn$;

revoke all on function public.next_order_code(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper interno: aplica o commit do pedido (saída de estoque + recebível)
-- ---------------------------------------------------------------------------
create or replace function public.apply_order_commit(p_order_id uuid, p_due_date date)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
  v_faltando text;
begin
  select * into v_order from public.orders where id = p_order_id;

  select string_agg(
           sb.product_name || ' (saldo ' || sb.balance || ', pedido ' || i.quantity || ')', '; ')
    into v_faltando
    from public.order_items i
    join public.product_stock_balance sb on sb.product_id = i.product_id
   where i.order_id = p_order_id
     and sb.balance < i.quantity;

  if v_faltando is not null then
    raise exception 'Saldo insuficiente: %. Registre a entrada em Estoque antes de confirmar.',
      v_faltando;
  end if;

  insert into public.inventory_movements
    (company_id, product_id, type, quantity, unit_cost, reason,
     reference_type, reference_id, created_by)
  select
    v_order.company_id, i.product_id, 'out', i.quantity, p.cost,
    'Venda — pedido ' || v_order.code, 'order', v_order.id, auth.uid()
    from public.order_items i
    join public.products p on p.id = i.product_id
   where i.order_id = p_order_id;

  if v_order.total > 0 then
    insert into public.finance_transactions
      (company_id, type, category, description, amount, due_date, status,
       reference_type, reference_id, created_by)
    values
      (v_order.company_id, 'receivable', 'Vendas', 'Pedido ' || v_order.code,
       v_order.total, coalesce(p_due_date, current_date), 'pending',
       'order', v_order.id, auth.uid());
  end if;
end;
$fn$;

revoke all on function public.apply_order_commit(uuid, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper interno: compensa a saída de estoque de um pedido comprometido.
-- Compensação é sempre fato novo: as movimentações originais permanecem.
-- ---------------------------------------------------------------------------
create or replace function public.reverse_order_stock(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;

  insert into public.inventory_movements
    (company_id, product_id, type, quantity, unit_cost, reason,
     reference_type, reference_id, created_by)
  select
    v_order.company_id, i.product_id, 'in', i.quantity, p.cost,
    p_reason || ' — pedido ' || v_order.code, 'order', v_order.id, auth.uid()
    from public.order_items i
    join public.products p on p.id = i.product_id
   where i.order_id = p_order_id;
end;
$fn$;

revoke all on function public.reverse_order_stock(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create_order
-- p_items: [{"product_id": uuid, "quantity": numeric, "discount": numeric}]
-- O preço unitário NÃO vem do cliente: é lido de products.price no servidor,
-- que é onde a decisão "preço travado" precisa ser garantida.
-- Autorização: orders.create — registrar uma venda, confirmada ou não.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_items       jsonb,
  p_customer_id uuid    default null,
  p_discount    numeric default 0,
  p_notes       text    default null,
  p_due_date    date    default null,
  p_confirm     boolean default false
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_company_id uuid := public.current_company_id();
  v_order      public.orders;
  v_subtotal   numeric(14,2);
  v_count      integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;
  if v_company_id is null then
    raise exception 'Nenhuma empresa ativa';
  end if;
  if not public.has_permission('orders.create') then
    raise exception 'Sem permissão para criar pedidos';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa de pelo menos um item';
  end if;
  if coalesce(p_discount, 0) < 0 then
    raise exception 'O desconto do pedido não pode ser negativo';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) it
     where coalesce((it->>'quantity')::numeric, 0) <= 0
        or coalesce((it->>'discount')::numeric, 0) < 0
  ) then
    raise exception 'Quantidade deve ser maior que zero e desconto não pode ser negativo';
  end if;

  if p_customer_id is not null then
    select count(*) into v_count
      from public.customers
     where id = p_customer_id and company_id = v_company_id and deleted_at is null;
    if v_count = 0 then
      raise exception 'Cliente não encontrado nesta empresa';
    end if;
  end if;

  select count(*) into v_count
    from jsonb_array_elements(p_items) it
    left join public.products p
      on p.id = (it->>'product_id')::uuid
     and p.company_id = v_company_id
     and p.deleted_at is null
     and p.is_active
   where p.id is null;
  if v_count > 0 then
    raise exception 'Há produtos inválidos ou inativos no pedido';
  end if;

  insert into public.orders (company_id, code, customer_id, status, discount, notes, created_by)
  values (v_company_id, public.next_order_code(v_company_id), p_customer_id, 'draft',
          coalesce(p_discount, 0), p_notes, auth.uid())
  returning * into v_order;

  insert into public.order_items (order_id, product_id, quantity, unit_price, discount, total)
  select
    v_order.id,
    p.id,
    (it->>'quantity')::numeric,
    p.price,
    coalesce((it->>'discount')::numeric, 0),
    (it->>'quantity')::numeric * p.price - coalesce((it->>'discount')::numeric, 0)
    from jsonb_array_elements(p_items) it
    join public.products p on p.id = (it->>'product_id')::uuid
   where p.company_id = v_company_id;

  if exists (select 1 from public.order_items where order_id = v_order.id and total < 0) then
    raise exception 'O desconto de um item não pode ser maior que o valor da linha';
  end if;

  select coalesce(sum(total), 0) into v_subtotal
    from public.order_items where order_id = v_order.id;

  if v_subtotal - coalesce(p_discount, 0) < 0 then
    raise exception 'O desconto do pedido não pode ser maior que o subtotal';
  end if;

  update public.orders
     set subtotal = v_subtotal,
         total    = v_subtotal - coalesce(p_discount, 0),
         status   = case when p_confirm then 'confirmed' else 'draft' end
   where id = v_order.id
  returning * into v_order;

  if p_confirm then
    perform public.apply_order_commit(v_order.id, p_due_date);
  end if;

  return v_order;
end;
$fn$;

revoke all on function public.create_order(jsonb, uuid, numeric, text, date, boolean)
  from public, anon;
grant execute on function public.create_order(jsonb, uuid, numeric, text, date, boolean)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: confirm_order — draft -> confirmed. Autorização: orders.update
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order(p_order_id uuid, p_due_date date default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and company_id = public.current_company_id() and deleted_at is null;

  if v_order.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  if not public.has_permission('orders.update') then
    raise exception 'Sem permissão para confirmar pedidos';
  end if;
  if v_order.status <> 'draft' then
    raise exception 'Só é possível confirmar um pedido em rascunho';
  end if;

  update public.orders set status = 'confirmed' where id = p_order_id returning * into v_order;
  perform public.apply_order_commit(p_order_id, p_due_date);
  return v_order;
end;
$fn$;

revoke all on function public.confirm_order(uuid, date) from public, anon;
grant execute on function public.confirm_order(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: cancel_order — draft|confirmed -> cancelled. Autorização: orders.cancel
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and company_id = public.current_company_id() and deleted_at is null;

  if v_order.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  if not public.has_permission('orders.cancel') then
    raise exception 'Sem permissão para cancelar pedidos';
  end if;
  if v_order.status not in ('draft', 'confirmed') then
    raise exception 'Só é possível cancelar um pedido em rascunho ou confirmado';
  end if;

  if v_order.status = 'confirmed' then
    perform public.reverse_order_stock(p_order_id, 'Cancelamento');
    update public.finance_transactions
       set status = 'cancelled'
     where reference_type = 'order' and reference_id = p_order_id
       and type = 'receivable' and status = 'pending';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id returning * into v_order;
  return v_order;
end;
$fn$;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: pay_order — confirmed -> paid. Autorização: orders.update
-- Liquida o recebível e registra COMO o dinheiro entrou (ADR 0003).
-- ---------------------------------------------------------------------------
create or replace function public.pay_order(
  p_order_id uuid,
  p_method   text,
  p_paid_at  timestamptz default now()
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and company_id = public.current_company_id() and deleted_at is null;

  if v_order.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  if not public.has_permission('orders.update') then
    raise exception 'Sem permissão para registrar pagamento';
  end if;
  if v_order.status <> 'confirmed' then
    raise exception 'Só é possível pagar um pedido confirmado';
  end if;
  if coalesce(p_method, '') = '' then
    raise exception 'Informe a forma de pagamento';
  end if;

  -- Pedido de valor zero (desconto integral) não movimenta dinheiro: não há
  -- pagamento a registrar, do mesmo modo que a confirmação não cria recebível.
  -- Sem esta guarda o insert bate em payments_amount_check e vaza erro cru.
  if v_order.total > 0 then
    insert into public.payments (order_id, method, amount, paid_at, status)
    values (p_order_id, p_method, v_order.total, p_paid_at, 'paid');
  end if;

  update public.finance_transactions
     set status = 'paid', paid_at = p_paid_at
   where reference_type = 'order' and reference_id = p_order_id
     and type = 'receivable' and status = 'pending';

  update public.orders set status = 'paid' where id = p_order_id returning * into v_order;
  return v_order;
end;
$fn$;

revoke all on function public.pay_order(uuid, text, timestamptz) from public, anon;
grant execute on function public.pay_order(uuid, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: refund_order — paid -> refunded. Autorização: orders.refund
-- O recebível pago NÃO é editado: nasce um pagável de devolução (ADR 0003).
-- ---------------------------------------------------------------------------
create or replace function public.refund_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.orders;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and company_id = public.current_company_id() and deleted_at is null;

  if v_order.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  if not public.has_permission('orders.refund') then
    raise exception 'Sem permissão para reembolsar pedidos';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'Só é possível reembolsar um pedido pago';
  end if;

  perform public.reverse_order_stock(p_order_id, 'Reembolso');

  if v_order.total > 0 then
    insert into public.finance_transactions
      (company_id, type, category, description, amount, due_date, status,
       reference_type, reference_id, created_by)
    values
      (v_order.company_id, 'payable', 'Reembolsos', 'Reembolso do pedido ' || v_order.code,
       v_order.total, current_date, 'pending', 'order', v_order.id, auth.uid());
  end if;

  update public.orders set status = 'refunded' where id = p_order_id returning * into v_order;
  return v_order;
end;
$fn$;

revoke all on function public.refund_order(uuid) from public, anon;
grant execute on function public.refund_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Pedido nunca é deletado fisicamente: é cancelado. A permission orders.cancel
-- passa a gatear o cancelamento, que é o que o nome sempre prometeu.
-- ---------------------------------------------------------------------------
drop policy if exists "orders_delete" on public.orders;
