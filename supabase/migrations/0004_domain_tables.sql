-- =============================================================================
-- AURORA ERP — 0004 — Tabelas de domínio (customers, suppliers, products,
-- categories, inventory_movements, orders, order_items, payments, finance)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  document    text,                        -- CPF/CNPJ (apenas dígitos)
  email       text,
  phone       text,
  address     jsonb not null default '{}'::jsonb,
  notes       text,
  status      text not null default 'active'
                check (status in ('active','inactive','blocked')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists customers_company_name_idx
  on public.customers (company_id, name);
create unique index if not exists customers_company_document_unique
  on public.customers (company_id, document)
  where document is not null and deleted_at is null;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  document    text,
  email       text,
  phone       text,
  address     jsonb not null default '{}'::jsonb,
  notes       text,
  status      text not null default 'active'
                check (status in ('active','inactive','blocked')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists suppliers_company_name_idx
  on public.suppliers (company_id, name);
create unique index if not exists suppliers_company_document_unique
  on public.suppliers (company_id, document)
  where document is not null and deleted_at is null;

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- CATEGORIES (hierárquico)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  parent_id   uuid references public.categories(id) on delete set null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists categories_company_idx on public.categories (company_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  sku          text,
  barcode      text,
  name         text not null,
  description  text,
  unit         text not null default 'un',
  price        numeric(14,2) not null default 0 check (price >= 0),
  cost         numeric(14,2) not null default 0 check (cost >= 0),
  stock_min    numeric(14,3) not null default 0,
  is_active    boolean not null default true,
  images       jsonb not null default '[]'::jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists products_company_name_idx on public.products (company_id, name);
create unique index if not exists products_company_sku_unique
  on public.products (company_id, sku)
  where sku is not null and deleted_at is null;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- INVENTORY_MOVEMENTS
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  type            text not null check (type in ('in','out','adjust')),
  quantity        numeric(14,3) not null,
  unit_cost       numeric(14,2),
  reason          text,
  reference_type  text,                      -- ex: 'order', 'manual'
  reference_id    uuid,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists inv_mov_company_product_idx
  on public.inventory_movements (company_id, product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  code         text not null,
  customer_id  uuid references public.customers(id) on delete set null,
  status       text not null default 'draft'
                 check (status in ('draft','confirmed','paid','cancelled','refunded')),
  subtotal     numeric(14,2) not null default 0,
  discount     numeric(14,2) not null default 0,
  total        numeric(14,2) not null default 0,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (company_id, code)
);

create index if not exists orders_company_status_idx on public.orders (company_id, status);
create index if not exists orders_company_customer_idx on public.orders (company_id, customer_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ORDER_ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity   numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount   numeric(14,2) not null default 0,
  total      numeric(14,2) not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  method     text not null,             -- pix, credit_card, boleto, cash, ...
  amount     numeric(14,2) not null check (amount > 0),
  paid_at    timestamptz,
  status     text not null default 'pending'
              check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- FINANCE_TRANSACTIONS
-- ---------------------------------------------------------------------------
create table if not exists public.finance_transactions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  type           text not null check (type in ('payable','receivable')),
  category       text,
  description    text not null,
  amount         numeric(14,2) not null check (amount > 0),
  due_date       date not null,
  paid_at        timestamptz,
  status         text not null default 'pending'
                  check (status in ('pending','paid','overdue','cancelled')),
  reference_type text,
  reference_id   uuid,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists finance_company_due_idx
  on public.finance_transactions (company_id, status, due_date);

create trigger finance_set_updated_at
  before update on public.finance_transactions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — padrão (isolation por tenant + permissions em writes)
-- =============================================================================

alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.finance_transactions enable row level security;

-- Helper macro-style: aplicar isolamento + permissions a uma tabela
-- (executar manualmente para cada tabela abaixo)

-- ===== customers =====
create policy "customers_select" on public.customers
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "customers_insert" on public.customers
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('customers.create')
  );
create policy "customers_update" on public.customers
  for update using (
    company_id = public.current_company_id() and public.has_permission('customers.update')
  );
create policy "customers_delete" on public.customers
  for delete using (
    company_id = public.current_company_id() and public.has_permission('customers.delete')
  );

-- ===== suppliers =====
create policy "suppliers_select" on public.suppliers
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "suppliers_insert" on public.suppliers
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('suppliers.create')
  );
create policy "suppliers_update" on public.suppliers
  for update using (
    company_id = public.current_company_id() and public.has_permission('suppliers.update')
  );
create policy "suppliers_delete" on public.suppliers
  for delete using (
    company_id = public.current_company_id() and public.has_permission('suppliers.delete')
  );

-- ===== categories =====
create policy "categories_select" on public.categories
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "categories_write" on public.categories
  for all using (
    company_id = public.current_company_id() and public.has_permission('products.update')
  ) with check (
    company_id = public.current_company_id() and public.has_permission('products.update')
  );

-- ===== products =====
create policy "products_select" on public.products
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "products_insert" on public.products
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('products.create')
  );
create policy "products_update" on public.products
  for update using (
    company_id = public.current_company_id() and public.has_permission('products.update')
  );
create policy "products_delete" on public.products
  for delete using (
    company_id = public.current_company_id() and public.has_permission('products.delete')
  );

-- ===== inventory_movements =====
create policy "inv_mov_select" on public.inventory_movements
  for select using (company_id = public.current_company_id());
create policy "inv_mov_insert" on public.inventory_movements
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('inventory.move')
  );

-- ===== orders =====
create policy "orders_select" on public.orders
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "orders_insert" on public.orders
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('orders.create')
  );
create policy "orders_update" on public.orders
  for update using (
    company_id = public.current_company_id() and public.has_permission('orders.update')
  );
create policy "orders_delete" on public.orders
  for delete using (
    company_id = public.current_company_id() and public.has_permission('orders.cancel')
  );

-- ===== order_items =====
create policy "order_items_select" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id
              and o.company_id = public.current_company_id())
  );
create policy "order_items_write" on public.order_items
  for all using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id
              and o.company_id = public.current_company_id())
    and public.has_permission('orders.update')
  ) with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id
              and o.company_id = public.current_company_id())
    and public.has_permission('orders.update')
  );

-- ===== payments =====
create policy "payments_select" on public.payments
  for select using (
    exists (select 1 from public.orders o
            where o.id = payments.order_id
              and o.company_id = public.current_company_id())
  );
create policy "payments_write" on public.payments
  for all using (
    exists (select 1 from public.orders o
            where o.id = payments.order_id
              and o.company_id = public.current_company_id())
    and public.has_permission('orders.update')
  ) with check (
    exists (select 1 from public.orders o
            where o.id = payments.order_id
              and o.company_id = public.current_company_id())
    and public.has_permission('orders.update')
  );

-- ===== finance_transactions =====
create policy "finance_select" on public.finance_transactions
  for select using (company_id = public.current_company_id() and deleted_at is null);
create policy "finance_insert" on public.finance_transactions
  for insert with check (
    company_id = public.current_company_id() and public.has_permission('finance.create')
  );
create policy "finance_update" on public.finance_transactions
  for update using (
    company_id = public.current_company_id() and public.has_permission('finance.update')
  );
create policy "finance_delete" on public.finance_transactions
  for delete using (
    company_id = public.current_company_id() and public.has_permission('finance.delete')
  );
