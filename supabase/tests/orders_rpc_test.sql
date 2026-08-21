-- Exercita as RPCs da migration 0007 contra Postgres real.
-- Cada caso roda como o PostgREST rodaria: role authenticated + claims do JWT.

create or replace function public.expect_error(p_sql text, p_fragment text, p_label text)
returns void
language plpgsql
as $$
declare
  v_msg text;
begin
  begin
    execute p_sql;
    raise exception 'FALHOU [%]: esperava erro contendo "%", mas a chamada passou', p_label, p_fragment;
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like 'FALHOU%' then
      raise;
    elsif v_msg like '%' || p_fragment || '%' then
      raise notice 'ok   % -> %', p_label, left(v_msg, 90);
    else
      raise exception 'FALHOU [%]: esperava "%", veio "%"', p_label, p_fragment, v_msg;
    end if;
  end;
end;
$$;

create or replace function public.expect_eq(p_actual anyelement, p_expected anyelement, p_label text)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FALHOU [%]: esperava "%", veio "%"', p_label, p_expected, p_actual;
  end if;
  raise notice 'ok   % -> %', p_label, p_actual;
end;
$$;

-- ---------------------------------------------------------------------------
-- SETUP
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@nexus.test'),
  ('22222222-2222-2222-2222-222222222222', 'viewer@nexus.test'),
  ('33333333-3333-3333-3333-333333333333', 'owner@outra.test');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111');
select id as c1 from public.create_company_with_owner('Nexus Teste', '11222333000181') \gset
reset role;

set role authenticated;
select public.test_login('33333333-3333-3333-3333-333333333333');
select id as c2 from public.create_company_with_owner('Outra Empresa', '99888777000166') \gset
reset role;

-- viewer na c1: role 00..05, só leitura
insert into public.user_companies (user_id, company_id, role_id, status)
values ('22222222-2222-2222-2222-222222222222', :'c1',
        '00000000-0000-0000-0000-000000000005', 'active');

insert into public.products (id, company_id, name, sku, price, cost, stock_min, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', :'c1', 'Teclado',  'TEC-1', 100.00, 60.00, 5, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', :'c1', 'Mouse',    'MOU-1',  50.00, 20.00, 5, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', :'c1', 'Monitor',  'MON-1', 900.00, 700.00, 1, false),
  ('bbbbbbbb-0000-0000-0000-000000000001', :'c2', 'Cadeira',  'CAD-1', 300.00, 150.00, 1, true);

insert into public.customers (id, company_id, name, status) values
  ('cccccccc-0000-0000-0000-000000000001', :'c1', 'Cliente C1', 'active'),
  ('cccccccc-0000-0000-0000-000000000002', :'c2', 'Cliente C2', 'active');

\echo '=============== VALIDACOES ==============='

-- ---------------------------------------------------------------------------
-- Guardas de entrada
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');

select public.expect_error(
  $$ select public.create_order('[]'::jsonb) $$,
  'pelo menos um item', 'T01 pedido sem itens');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":0}]'::jsonb) $$,
         'aaaaaaaa-0000-0000-0000-000000000001'),
  'Quantidade deve ser maior que zero', 'T02 quantidade zero');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb) $$,
         'aaaaaaaa-0000-0000-0000-000000000003'),
  'inválidos ou inativos', 'T03 produto inativo');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb) $$,
         'bbbbbbbb-0000-0000-0000-000000000001'),
  'inválidos ou inativos', 'T04 produto de outra empresa');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb, '%s') $$,
         'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002'),
  'Cliente não encontrado', 'T05 cliente de outra empresa');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1,"discount":150}]'::jsonb) $$,
         'aaaaaaaa-0000-0000-0000-000000000001'),
  'desconto de um item', 'T06 desconto do item maior que a linha');

select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb, null, 500) $$,
         'aaaaaaaa-0000-0000-0000-000000000001'),
  'maior que o subtotal', 'T07 desconto do pedido maior que o subtotal');

-- ---------------------------------------------------------------------------
-- Rascunho: numeração, preço travado no servidor, totais
-- ---------------------------------------------------------------------------
select id as o1 from public.create_order(
  format('[{"product_id":"%s","quantity":2,"unit_price":1},{"product_id":"%s","quantity":1}]',
         'aaaaaaaa-0000-0000-0000-000000000001',
         'aaaaaaaa-0000-0000-0000-000000000002')::jsonb,
  'cccccccc-0000-0000-0000-000000000001', 50, 'primeiro') \gset
reset role;

select public.expect_eq((select code     from public.orders where id = :'o1'),
                        'PED-' || extract(year from now())::int || '-000001', 'T08 código sequencial');
select public.expect_eq((select status   from public.orders where id = :'o1'), 'draft',    'T09 nasce rascunho');
select public.expect_eq((select subtotal from public.orders where id = :'o1'), 250.00,     'T10 subtotal');
select public.expect_eq((select total    from public.orders where id = :'o1'), 200.00,     'T11 total com desconto');
select public.expect_eq((select unit_price from public.order_items
                          where order_id = :'o1'
                            and product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        100.00, 'T12 preço vem do servidor, não do cliente');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select id as o2 from public.create_order(
  format('[{"product_id":"%s","quantity":1}]', 'aaaaaaaa-0000-0000-0000-000000000002')::jsonb) \gset
reset role;
select public.expect_eq((select code from public.orders where id = :'o2'),
                        'PED-' || extract(year from now())::int || '-000002', 'T13 numeração incrementa');

-- ---------------------------------------------------------------------------
-- Confirmação: saldo de estoque é pré-condição
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.expect_error(
  format($$ select public.confirm_order('%s') $$, :'o1'),
  'Saldo insuficiente', 'T14 confirmar sem estoque');
reset role;

insert into public.inventory_movements (company_id, product_id, type, quantity, reason)
values (:'c1', 'aaaaaaaa-0000-0000-0000-000000000001', 'in', 10, 'carga inicial'),
       (:'c1', 'aaaaaaaa-0000-0000-0000-000000000002', 'in', 10, 'carga inicial');

select public.expect_eq((select balance from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        10.000, 'T15 view soma as entradas');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.confirm_order(:'o1');
select public.expect_error(format($$ select public.confirm_order('%s') $$, :'o1'),
                           'rascunho', 'T17 confirmar duas vezes');
reset role;

select public.expect_eq((select status from public.orders where id = :'o1'), 'confirmed', 'T16 status confirmado');
select public.expect_eq((select balance from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        8.000, 'T18 estoque baixou na confirmação');
select public.expect_eq((select count(*)::int from public.inventory_movements
                          where reference_id = :'o1' and type = 'out'), 2, 'T19 uma saída por item');
select public.expect_eq((select amount from public.finance_transactions
                          where reference_id = :'o1' and type = 'receivable'),
                        200.00, 'T20 recebível com o total do pedido');
select public.expect_eq((select status from public.finance_transactions
                          where reference_id = :'o1' and type = 'receivable'),
                        'pending', 'T21 recebível nasce pendente');

-- ---------------------------------------------------------------------------
-- Pagamento e reembolso
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.expect_error(format($$ select public.pay_order('%s', '') $$, :'o1'),
                           'forma de pagamento', 'T22 pagar sem método');
select public.pay_order(:'o1', 'pix');
reset role;

select public.expect_eq((select status from public.orders where id = :'o1'), 'paid', 'T23 pedido pago');
select public.expect_eq((select amount from public.payments where order_id = :'o1'), 200.00, 'T24 pagamento com o total');
select public.expect_eq((select status from public.finance_transactions
                          where reference_id = :'o1' and type = 'receivable'), 'paid', 'T25 recebível liquidado');
select public.expect_eq((select paid_at is not null from public.finance_transactions
                          where reference_id = :'o1' and type = 'receivable'), true, 'T26 recebível com paid_at');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.refund_order(:'o1');
reset role;

select public.expect_eq((select status from public.orders where id = :'o1'), 'refunded', 'T27 pedido reembolsado');
select public.expect_eq((select balance from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        10.000, 'T28 estoque devolvido pelo reembolso');
select public.expect_eq((select count(*)::int from public.finance_transactions
                          where reference_id = :'o1' and type = 'payable'), 1, 'T29 reembolso vira pagável');
select public.expect_eq((select status from public.finance_transactions
                          where reference_id = :'o1' and type = 'receivable'), 'paid', 'T30 recebível pago não é editado');

-- ---------------------------------------------------------------------------
-- Cancelamento
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select id as o3 from public.create_order(
  format('[{"product_id":"%s","quantity":3}]', 'aaaaaaaa-0000-0000-0000-000000000001')::jsonb,
  null, 0, null, null, true) \gset
reset role;

select public.expect_eq((select status from public.orders where id = :'o3'), 'confirmed', 'T31 create_order com p_confirm');
select public.expect_eq((select balance from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        7.000, 'T32 estoque baixou na criação confirmada');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.cancel_order(:'o3');
select public.expect_error(format($$ select public.cancel_order('%s') $$, :'o1'),
                           'rascunho ou confirmado', 'T35 cancelar pedido reembolsado');
reset role;

select public.expect_eq((select status from public.orders where id = :'o3'), 'cancelled', 'T33 pedido cancelado');
select public.expect_eq((select balance from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                        10.000, 'T34 estoque devolvido pelo cancelamento');
select public.expect_eq((select status from public.finance_transactions
                          where reference_id = :'o3' and type = 'receivable'), 'cancelled', 'T36 recebível cancelado');

-- ---------------------------------------------------------------------------
-- Autorização e isolamento entre empresas
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('22222222-2222-2222-2222-222222222222', :'c1');
select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb) $$,
         'aaaaaaaa-0000-0000-0000-000000000001'),
  'Sem permissão', 'T37 viewer não cria pedido');
reset role;

set role authenticated;
select public.test_login('33333333-3333-3333-3333-333333333333', :'c2');
select public.expect_error(format($$ select public.confirm_order('%s') $$, :'o2'),
                           'Pedido não encontrado', 'T38 outra empresa não enxerga o pedido');
select public.expect_error(format($$ select public.cancel_order('%s') $$, :'o2'),
                           'Pedido não encontrado', 'T39 outra empresa não cancela');
reset role;

-- Sem o claim, current_company_id() cai para a primeira empresa ativa do usuário:
-- o claim diz qual empresa está aberta, não é a fronteira de acesso.
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', null);
select id as o5 from public.create_order(
  format('[{"product_id":"%s","quantity":1}]', 'aaaaaaaa-0000-0000-0000-000000000001')::jsonb) \gset
reset role;
select public.expect_eq((select company_id from public.orders where id = :'o5'), :'c1'::uuid,
                        'T40 sem claim, resolve pela primeira empresa ativa');

insert into auth.users (id, email) values ('44444444-4444-4444-4444-444444444444', 'orfao@test');

set role authenticated;
select public.test_login('44444444-4444-4444-4444-444444444444');
select public.expect_error(
  format($$ select public.create_order('[{"product_id":"%s","quantity":1}]'::jsonb) $$,
         'aaaaaaaa-0000-0000-0000-000000000001'),
  'Nenhuma empresa ativa', 'T40b usuário sem empresa alguma');
reset role;

-- ---------------------------------------------------------------------------
-- Borda: pedido de total zero
-- ---------------------------------------------------------------------------
set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select id as o4 from public.create_order(
  format('[{"product_id":"%s","quantity":1}]', 'aaaaaaaa-0000-0000-0000-000000000002')::jsonb,
  null, 50, null, null, true) \gset
reset role;

select public.expect_eq((select total from public.orders where id = :'o4'), 0.00, 'T41 pedido de total zero confirma');
select public.expect_eq((select count(*)::int from public.finance_transactions
                          where reference_id = :'o4'), 0, 'T42 total zero não gera recebível');

set role authenticated;
select public.test_login('11111111-1111-1111-1111-111111111111', :'c1');
select public.pay_order(:'o4', 'pix');
reset role;

select public.expect_eq((select status from public.orders where id = :'o4'), 'paid',
                        'T43 pedido de total zero chega a pago');
select public.expect_eq((select count(*)::int from public.payments where order_id = :'o4'), 0,
                        'T44 total zero não registra pagamento');

-- ---------------------------------------------------------------------------
-- A view precisa expor is_active, senão o ProductPicker oferece produto inativo
-- e o usuário só descobre no submit.
-- ---------------------------------------------------------------------------
select public.expect_eq((select is_active from public.product_stock_balance
                          where product_id = 'aaaaaaaa-0000-0000-0000-000000000003'),
                        false, 'T45 view expõe is_active');
select public.expect_eq((select count(*)::int from public.product_stock_balance
                          where company_id = :'c1' and is_active),
                        2, 'T46 filtro is_active deixa só os vendáveis');

\echo '=============== TODAS AS VALIDACOES PASSARAM ==============='
