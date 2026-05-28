/**
 * Dados mock para o dashboard.
 * Serão substituídos quando os módulos de domínio existirem.
 */

const days = Array.from({ length: 14 }, (_, i) => i);

export const kpis = {
  revenue: {
    value: 84520.5,
    delta: 0.124,
    series: days.map((i) => ({
      label: `D-${14 - i}`,
      value: Math.round(3000 + Math.random() * 6000),
    })),
  },
  orders: {
    value: 342,
    delta: 0.072,
    series: days.map((i) => ({ label: `D-${14 - i}`, value: Math.round(10 + Math.random() * 30) })),
  },
  customers: {
    value: 1284,
    delta: 0.034,
    series: days.map((i) => ({ label: `D-${14 - i}`, value: Math.round(20 + Math.random() * 12) })),
  },
  ticket: {
    value: 247.13,
    delta: -0.015,
    series: days.map((i) => ({ label: `D-${14 - i}`, value: Math.round(180 + Math.random() * 100) })),
  },
};

export const revenueByDay = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 2000 + i * 80;
  return {
    day: String(day).padStart(2, '0'),
    receita: Math.round(base + Math.random() * 1500),
    custo: Math.round(base * 0.55 + Math.random() * 600),
  };
});

export const ordersByStatus = [
  { status: 'Pagos', value: 218 },
  { status: 'Confirmados', value: 84 },
  { status: 'Rascunho', value: 27 },
  { status: 'Cancelados', value: 13 },
];

export const recentActivities = [
  {
    id: '1',
    icon: 'order',
    title: 'Pedido #2057 confirmado',
    description: 'Cliente: Marina Souza · R$ 1.248,90',
    when: '2 min atrás',
  },
  {
    id: '2',
    icon: 'product',
    title: 'Estoque baixo: Cadeira Ergonômica Pro',
    description: 'Apenas 4 unidades restantes (mínimo: 10)',
    when: '18 min atrás',
  },
  {
    id: '3',
    icon: 'customer',
    title: 'Novo cliente cadastrado',
    description: 'Lúcio Almeida · luciio@exemplo.com',
    when: '1h atrás',
  },
  {
    id: '4',
    icon: 'finance',
    title: 'Recebimento confirmado',
    description: 'Nota #4128 · R$ 3.560,00',
    when: '3h atrás',
  },
  {
    id: '5',
    icon: 'order',
    title: 'Pedido #2056 cancelado',
    description: 'Cliente: TechHub Distribuidora · R$ 894,00',
    when: '5h atrás',
  },
];
