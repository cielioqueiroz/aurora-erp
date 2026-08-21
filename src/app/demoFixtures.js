import { addDays, subDays } from 'date-fns';

const today = new Date();
const iso = (d) => d.toISOString();

let nextId = 1;
const uid = () => `demo-${String(nextId++).padStart(6, '0')}`;

const DEMO_COMPANY_ID = '00000000-aaaa-aaaa-aaaa-000000000001';
const DEMO_USER_ID = '00000000-bbbb-bbbb-bbbb-000000000001';

const base = (extra) => ({
  id: uid(),
  company_id: DEMO_COMPANY_ID,
  created_by: DEMO_USER_ID,
  created_at: iso(subDays(today, Math.floor(Math.random() * 60))),
  updated_at: iso(today),
  deleted_at: null,
  ...extra,
});

const customersSeed = [
  ['Marina Souza', '52998224725', 'marina.souza@exemplo.com', '11999991111', 'active'],
  ['Lúcio Almeida', '03945567890', 'lucio.almeida@exemplo.com', '11988882222', 'active'],
  ['TechHub Ltda', '11222333000181', 'contato@techhub.com.br', '1133334444', 'active'],
  ['Ana Vieira', '12345678909', 'ana.vieira@exemplo.com', '11977774444', 'active'],
  ['Café Aurora ME', '34567890000123', 'pedidos@cafeaurora.com.br', '1144442222', 'inactive'],
  ['João Pedro', '98765432100', 'joao.pedro@exemplo.com', '11955558888', 'active'],
  ['Lojas Atlas', '45678901000156', 'compras@lojasatlas.com.br', '1133338888', 'active'],
  ['Beatriz Carvalho', '78912345600', 'bia@exemplo.com', '11966661111', 'active'],
  ['Marcelo Tavares', '15975346800', 'marcelo@exemplo.com', '11944443333', 'blocked'],
  ['Mercado Verde', '23456789000198', 'contato@mercadoverde.com', '1145671234', 'active'],
];

export const demoCustomers = customersSeed.map(([name, document, email, phone, status]) =>
  base({ name, document, email, phone, status, address: {}, notes: '' }),
);

const suppliersSeed = [
  ['Distribuidora Atlas', '12345678000190', 'comercial@atlas.com.br', '1133221100', 'active'],
  ['Importadora Sol', '23456789000189', 'contato@sol.com.br', '1144551122', 'active'],
  ['Grãos do Cerrado', '34567890000178', 'pedidos@cerrado.com.br', '1155667788', 'active'],
  ['Embalagens Líder', '45678901000167', 'vendas@lider.com.br', '1166778899', 'active'],
  ['Logística Express', '56789012000156', 'sac@express.com.br', '1177889900', 'inactive'],
];

export const demoSuppliers = suppliersSeed.map(([name, document, email, phone, status]) =>
  base({ name, document, email, phone, status, address: {}, notes: '' }),
);

const cat = (name) => base({ name, parent_id: null, description: '' });
export const demoCategories = [
  cat('Bebidas'),
  cat('Cafés'),
  cat('Equipamentos'),
  cat('Acessórios'),
  cat('Embalagens'),
];

const productsSeed = [
  [
    'CAF-001',
    'Café Especial Aurora 250g',
    'Cafés',
    45.9,
    18.5,
    'un',
    10,
    'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400',
  ],
  ['CAF-002', 'Café Espresso Blend 1kg', 'Cafés', 129.9, 62.0, 'un', 15],
  ['BEB-101', 'Chá Verde Premium 100g', 'Bebidas', 32.5, 14.0, 'un', 20],
  ['EQU-201', 'Cafeteira Italiana 6 xícaras', 'Equipamentos', 189.0, 92.0, 'un', 8],
  ['EQU-202', 'Moedor de Café Manual', 'Equipamentos', 249.9, 110.0, 'un', 5],
  ['ACE-301', 'Caneca Aurora 300ml', 'Acessórios', 39.9, 12.0, 'un', 25],
  ['ACE-302', 'Filtro de Papel nº 103 (40un)', 'Acessórios', 14.5, 5.5, 'un', 50],
  ['EMB-401', 'Sacola Kraft P (100un)', 'Embalagens', 78.0, 35.0, 'un', 30],
];

const catByName = Object.fromEntries(demoCategories.map((c) => [c.name, c.id]));
export const demoProducts = productsSeed.map(
  ([sku, name, catName, price, cost, unit, stock_min, image]) =>
    base({
      sku,
      barcode: null,
      name,
      description: '',
      category_id: catByName[catName],
      unit,
      price,
      cost,
      stock_min,
      is_active: true,
      images: image ? [image] : [],
    }),
);

export const demoInventoryMovements = [];
demoProducts.forEach((product, idx) => {
  demoInventoryMovements.push(
    base({
      product_id: product.id,
      type: 'in',
      quantity: 50 + idx * 10,
      unit_cost: product.cost,
      reason: 'Estoque inicial',
      reference_type: 'manual',
      reference_id: null,
      created_at: iso(subDays(today, 30 + idx)),
    }),
  );

  for (let i = 0; i < 1 + (idx % 2); i += 1) {
    demoInventoryMovements.push(
      base({
        product_id: product.id,
        type: 'out',
        quantity: 3 + i,
        unit_cost: product.cost,
        reason: 'Venda',
        reference_type: 'order',
        reference_id: null,
        created_at: iso(subDays(today, 15 - i * 5)),
      }),
    );
  }
});

export const demoOrders = [];
export const demoOrderItems = [];
export const demoPayments = [];

const orderStatuses = ['draft', 'confirmed', 'paid', 'paid', 'paid', 'cancelled'];
for (let i = 0; i < 18; i += 1) {
  const customer = demoCustomers[i % demoCustomers.length];
  const status = orderStatuses[i % orderStatuses.length];
  const orderDate = subDays(today, Math.floor(Math.random() * 30));

  const items = [];
  const itemsCount = 1 + Math.floor(Math.random() * 3);
  let subtotal = 0;
  for (let j = 0; j < itemsCount; j += 1) {
    const product = demoProducts[(i + j) % demoProducts.length];
    const quantity = 1 + Math.floor(Math.random() * 3);
    const total = product.price * quantity;
    subtotal += total;
    items.push({
      product,
      quantity,
      unit_price: product.price,
      discount: 0,
      total,
    });
  }
  const discount = i % 4 === 0 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const total = subtotal - discount;

  const order = base({
    code: `PED-${String(2000 + i).padStart(4, '0')}`,
    customer_id: customer.id,
    status,
    subtotal,
    discount,
    total,
    notes: '',
    created_at: iso(orderDate),
  });
  demoOrders.push(order);

  items.forEach((it) => {
    demoOrderItems.push({
      id: uid(),
      order_id: order.id,
      product_id: it.product.id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount: it.discount,
      total: it.total,
    });
  });

  if (status === 'paid') {
    demoPayments.push({
      id: uid(),
      order_id: order.id,
      method: i % 3 === 0 ? 'pix' : i % 3 === 1 ? 'credit_card' : 'boleto',
      amount: total,
      paid_at: iso(addDays(orderDate, 1)),
      status: 'paid',
      created_at: iso(orderDate),
    });
  }
}

const financeSeed = [
  ['receivable', 'Vendas', 'NF #2042 — Marina Souza', 1248.9, -3, 'paid'],
  ['receivable', 'Vendas', 'NF #2043 — TechHub Ltda', 3560.0, 0, 'pending'],
  ['receivable', 'Vendas', 'NF #2044 — Ana Vieira', 512.0, 2, 'pending'],
  ['payable', 'Fornecedores', 'Fatura Distribuidora Atlas', 4870.0, 5, 'pending'],
  ['payable', 'Fornecedores', 'Fatura Importadora Sol', 1980.0, 8, 'pending'],
  ['payable', 'Fixos', 'Aluguel', 3200.0, -2, 'paid'],
  ['payable', 'Fixos', 'Energia elétrica', 480.0, 3, 'pending'],
  ['payable', 'Marketing', 'Anúncios Meta', 1200.0, 10, 'pending'],
  ['receivable', 'Vendas', 'NF #2045 — Lojas Atlas', 8240.0, -5, 'overdue'],
  ['receivable', 'Vendas', 'NF #2046 — Beatriz Carvalho', 320.0, 6, 'pending'],
];

export const demoFinanceTransactions = financeSeed.map(
  ([type, category, description, amount, offsetDays, status]) =>
    base({
      type,
      category,
      description,
      amount,
      due_date: iso(addDays(today, offsetDays)).slice(0, 10),
      paid_at: status === 'paid' ? iso(today) : null,
      status,
      reference_type: null,
      reference_id: null,
    }),
);

export const demoTeamMembers = [
  {
    id: DEMO_USER_ID,
    full_name: 'Visitante Demo',
    email: 'demo@auroraerp.local',
    role_name: 'owner',
    status: 'active',
    joined_at: iso(subDays(today, 60)),
  },
  {
    id: 'user-ana',
    full_name: 'Ana Vieira',
    email: 'ana@aurora.local',
    role_name: 'admin',
    status: 'active',
    joined_at: iso(subDays(today, 30)),
  },
  {
    id: 'user-joao',
    full_name: 'João Pedro',
    email: 'joao@aurora.local',
    role_name: 'manager',
    status: 'active',
    joined_at: iso(subDays(today, 15)),
  },
  {
    id: 'user-marina',
    full_name: 'Marina Souza',
    email: 'marina@aurora.local',
    role_name: 'operator',
    status: 'active',
    joined_at: iso(subDays(today, 10)),
  },
  {
    id: 'user-lucas',
    full_name: 'Lucas Ferreira',
    email: 'lucas@aurora.local',
    role_name: 'viewer',
    status: 'invited',
    joined_at: iso(subDays(today, 2)),
  },
];

export const demoRoles = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'owner',
    description: 'Proprietário (todas as permissões, indestrutível)',
    is_system_role: true,
    members: 1,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'admin',
    description: 'Administrador (gestão completa)',
    is_system_role: true,
    members: 1,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'manager',
    description: 'Gerente (operações sem settings/roles)',
    is_system_role: true,
    members: 1,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'operator',
    description: 'Operador (vendas e estoque)',
    is_system_role: true,
    members: 1,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'viewer',
    description: 'Visualizador (apenas leitura)',
    is_system_role: true,
    members: 1,
  },
];

export function paginateInMemory(
  rows,
  {
    filters = {},
    search,
    searchField = 'name',
    order = { field: 'created_at', asc: false },
    page = 1,
    perPage = 20,
  } = {},
) {
  let filtered = rows.filter((r) => !r.deleted_at);

  for (const [k, v] of Object.entries(filters)) {
    if (v == null || v === '') continue;
    filtered = filtered.filter((r) => r[k] === v);
  }

  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter((r) =>
      String(r[searchField] ?? '')
        .toLowerCase()
        .includes(term),
    );
  }

  if (order?.field) {
    const field = order.field;
    const dir = order.asc ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }

  const total = filtered.length;
  const from = (page - 1) * perPage;
  const data = filtered.slice(from, from + perPage);
  return { data, count: total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export function applyMutation(rows, action, payload) {
  if (action === 'create') {
    const item = base(payload);
    rows.unshift(item);
    return item;
  }
  if (action === 'update') {
    const idx = rows.findIndex((r) => r.id === payload.id);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...payload, updated_at: iso(new Date()) };
      return rows[idx];
    }
    return null;
  }
  if (action === 'remove') {
    const idx = rows.findIndex((r) => r.id === payload);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], deleted_at: iso(new Date()) };
      return rows[idx];
    }
    return null;
  }
  if (action === 'getById') {
    return rows.find((r) => r.id === payload) ?? null;
  }
  return null;
}

const orderCodePrefix = () => `PED-${new Date().getFullYear()}-`;

function nextOrderCode() {
  const prefix = orderCodePrefix();
  const used = demoOrders
    .map((o) => o.code)
    .filter((c) => typeof c === 'string' && c.startsWith(prefix))
    .map((c) => Number(c.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(6, '0')}`;
}

export function demoStockBalance() {
  const balance = {};
  for (const mov of demoInventoryMovements) {
    const qty = Number(mov.quantity);
    const delta = mov.type === 'out' ? -qty : qty;
    balance[mov.product_id] = (balance[mov.product_id] ?? 0) + delta;
  }
  return demoProducts
    .filter((p) => !p.deleted_at)
    .map((p) => ({
      product_id: p.id,
      company_id: p.company_id,
      product_name: p.name,
      sku: p.sku,
      price: p.price,
      stock_min: p.stock_min,
      balance: balance[p.id] ?? 0,
    }));
}

function itemsOf(orderId) {
  return demoOrderItems.filter((i) => i.order_id === orderId);
}

function productOf(productId) {
  return demoProducts.find((p) => p.id === productId) ?? null;
}

function applyCommit(order, dueDate) {
  const balances = Object.fromEntries(demoStockBalance().map((b) => [b.product_id, b]));
  const missing = itemsOf(order.id)
    .filter((i) => (balances[i.product_id]?.balance ?? 0) < Number(i.quantity))
    .map((i) => {
      const b = balances[i.product_id];
      return `${b?.product_name ?? i.product_id} (saldo ${b?.balance ?? 0}, pedido ${i.quantity})`;
    });

  if (missing.length > 0) {
    throw new Error(
      `Saldo insuficiente: ${missing.join('; ')}. Registre a entrada em Estoque antes de confirmar.`,
    );
  }

  for (const item of itemsOf(order.id)) {
    demoInventoryMovements.push(
      base({
        product_id: item.product_id,
        type: 'out',
        quantity: Number(item.quantity),
        unit_cost: productOf(item.product_id)?.cost ?? null,
        reason: `Venda — pedido ${order.code}`,
        reference_type: 'order',
        reference_id: order.id,
        created_at: iso(new Date()),
      }),
    );
  }

  if (order.total > 0) {
    demoFinanceTransactions.unshift(
      base({
        type: 'receivable',
        category: 'Vendas',
        description: `Pedido ${order.code}`,
        amount: order.total,
        due_date: dueDate ?? iso(new Date()).slice(0, 10),
        paid_at: null,
        status: 'pending',
        reference_type: 'order',
        reference_id: order.id,
      }),
    );
  }
}

function reverseStock(order, reason) {
  for (const item of itemsOf(order.id)) {
    demoInventoryMovements.push(
      base({
        product_id: item.product_id,
        type: 'in',
        quantity: Number(item.quantity),
        unit_cost: productOf(item.product_id)?.cost ?? null,
        reason: `${reason} — pedido ${order.code}`,
        reference_type: 'order',
        reference_id: order.id,
        created_at: iso(new Date()),
      }),
    );
  }
}

function receivableOf(orderId, status) {
  return demoFinanceTransactions.find(
    (t) =>
      t.reference_type === 'order' &&
      t.reference_id === orderId &&
      t.type === 'receivable' &&
      t.status === status,
  );
}

export function demoCreateOrder({
  items = [],
  customerId = null,
  discount = 0,
  notes = '',
  dueDate = null,
  confirm = false,
}) {
  if (items.length === 0) throw new Error('O pedido precisa de pelo menos um item');
  if (discount < 0) throw new Error('O desconto do pedido não pode ser negativo');

  const resolved = items.map((it) => {
    const product = productOf(it.product_id);
    if (!product || !product.is_active || product.deleted_at) {
      throw new Error('Há produtos inválidos ou inativos no pedido');
    }
    const quantity = Number(it.quantity);
    const itemDiscount = Number(it.discount ?? 0);
    if (!(quantity > 0)) throw new Error('Quantidade deve ser maior que zero');
    if (itemDiscount < 0) throw new Error('O desconto do item não pode ser negativo');
    const total = Math.round((quantity * product.price - itemDiscount) * 100) / 100;
    if (total < 0) throw new Error('O desconto de um item não pode ser maior que o valor da linha');
    return { product, quantity, unit_price: product.price, discount: itemDiscount, total };
  });

  const subtotal = Math.round(resolved.reduce((acc, r) => acc + r.total, 0) * 100) / 100;
  if (subtotal - discount < 0) {
    throw new Error('O desconto do pedido não pode ser maior que o subtotal');
  }

  const order = base({
    code: nextOrderCode(),
    customer_id: customerId,
    status: 'draft',
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
    notes,
    created_at: iso(new Date()),
  });
  demoOrders.unshift(order);

  for (const r of resolved) {
    demoOrderItems.push({
      id: uid(),
      order_id: order.id,
      product_id: r.product.id,
      quantity: r.quantity,
      unit_price: r.unit_price,
      discount: r.discount,
      total: r.total,
    });
  }

  if (confirm) {
    order.status = 'confirmed';
    try {
      applyCommit(order, dueDate);
    } catch (err) {
      order.status = 'draft';
      const idx = demoOrders.indexOf(order);
      if (idx >= 0) demoOrders.splice(idx, 1);
      demoOrderItems
        .filter((i) => i.order_id === order.id)
        .forEach((i) => demoOrderItems.splice(demoOrderItems.indexOf(i), 1));
      throw err;
    }
  }

  return order;
}

export function demoConfirmOrder(orderId, dueDate = null) {
  const order = demoOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Pedido não encontrado');
  if (order.status !== 'draft') throw new Error('Só é possível confirmar um pedido em rascunho');
  applyCommit(order, dueDate);
  order.status = 'confirmed';
  order.updated_at = iso(new Date());
  return order;
}

export function demoCancelOrder(orderId) {
  const order = demoOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Pedido não encontrado');
  if (!['draft', 'confirmed'].includes(order.status)) {
    throw new Error('Só é possível cancelar um pedido em rascunho ou confirmado');
  }
  if (order.status === 'confirmed') {
    reverseStock(order, 'Cancelamento');
    const receivable = receivableOf(orderId, 'pending');
    if (receivable) receivable.status = 'cancelled';
  }
  order.status = 'cancelled';
  order.updated_at = iso(new Date());
  return order;
}

export function demoPayOrder(orderId, method, paidAt = null) {
  const order = demoOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Pedido não encontrado');
  if (order.status !== 'confirmed') throw new Error('Só é possível pagar um pedido confirmado');
  if (!method) throw new Error('Informe a forma de pagamento');

  const when = paidAt ?? iso(new Date());
  demoPayments.push({
    id: uid(),
    order_id: orderId,
    method,
    amount: order.total,
    paid_at: when,
    status: 'paid',
    created_at: when,
  });

  const receivable = receivableOf(orderId, 'pending');
  if (receivable) {
    receivable.status = 'paid';
    receivable.paid_at = when;
  }

  order.status = 'paid';
  order.updated_at = when;
  return order;
}

export function demoRefundOrder(orderId) {
  const order = demoOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Pedido não encontrado');
  if (order.status !== 'paid') throw new Error('Só é possível reembolsar um pedido pago');

  reverseStock(order, 'Reembolso');

  if (order.total > 0) {
    demoFinanceTransactions.unshift(
      base({
        type: 'payable',
        category: 'Reembolsos',
        description: `Reembolso do pedido ${order.code}`,
        amount: order.total,
        due_date: iso(new Date()).slice(0, 10),
        paid_at: null,
        status: 'pending',
        reference_type: 'order',
        reference_id: order.id,
      }),
    );
  }

  order.status = 'refunded';
  order.updated_at = iso(new Date());
  return order;
}
