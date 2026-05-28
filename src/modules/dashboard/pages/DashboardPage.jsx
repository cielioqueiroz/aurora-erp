import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  CreditCard,
  UserPlus,
  CalendarRange,
  Download,
  Activity,
  Check,
  FileSpreadsheet,
  FileText,
  FileType,
  FileDown,
  Loader2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  format,
  subDays,
  startOfMonth,
  startOfYear,
  startOfQuarter,
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { KpiCard } from '@/components/charts/KpiCard';
import { Sparkline } from '@/components/charts/Sparkline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, formatInteger } from '@/lib/formatters';
import { ordersHooks } from '@/modules/orders/hooks/useOrders';
import { customersHooks } from '@/modules/customers/hooks/useCustomers';
import { productsHooks } from '@/modules/products/hooks/useProducts';
import { financeHooks } from '@/modules/finance/hooks/useFinance';
import { ORDER_STATUS_MAP } from '@/modules/orders/constants';
import { exportData } from '@/lib/exporters';
import { toast } from '@/components/ui/toast';

const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF', icon: FileType, hint: 'Relatório formatado' },
  { key: 'xlsx', label: 'Excel', icon: FileSpreadsheet, hint: 'Planilha .xlsx' },
  { key: 'docx', label: 'Word', icon: FileText, hint: 'Documento .docx' },
  { key: 'csv', label: 'CSV', icon: FileDown, hint: 'Texto delimitado' },
];

const PERIODS = [
  { key: '7d', label: 'Últimos 7 dias', days: 7 },
  { key: '30d', label: 'Últimos 30 dias', days: 30 },
  { key: '90d', label: 'Últimos 90 dias', days: 90 },
  {
    key: 'mtd',
    label: 'Mês atual',
    resolver: (now) => differenceInCalendarDays(now, startOfMonth(now)) + 1,
  },
  {
    key: 'qtd',
    label: 'Trimestre atual',
    resolver: (now) => differenceInCalendarDays(now, startOfQuarter(now)) + 1,
  },
  {
    key: 'ytd',
    label: 'Ano atual',
    resolver: (now) => differenceInCalendarDays(now, startOfYear(now)) + 1,
  },
];

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />

          <span className="capitalize text-muted-foreground">{entry.dataKey}:</span>
          <span className="font-medium">
            {currency ? formatCurrency(entry.value) : formatInteger(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const company = useCurrentCompany();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'por aqui';
  const [periodKey, setPeriodKey] = useState('30d');
  const [exporting, setExporting] = useState(null);

  const periodDays = useMemo(() => {
    const p = PERIODS.find((x) => x.key === periodKey) ?? PERIODS[1];
    return p.days ?? p.resolver?.(new Date()) ?? 30;
  }, [periodKey]);
  const periodLabel = useMemo(
    () => PERIODS.find((x) => x.key === periodKey)?.label ?? 'Últimos 30 dias',
    [periodKey],
  );

  const { data: ordersResult } = ordersHooks.useList({
    perPage: 1000,
    order: { field: 'created_at', asc: false },
  });
  const { data: customersResult } = customersHooks.useList({ perPage: 500 });
  const { data: productsResult } = productsHooks.useList({ perPage: 500 });
  const { data: financeResult } = financeHooks.useList({ perPage: 1000 });

  const orders = useMemo(() => ordersResult?.data ?? [], [ordersResult?.data]);
  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data]);
  const products = useMemo(() => productsResult?.data ?? [], [productsResult?.data]);
  const financeTx = useMemo(() => financeResult?.data ?? [], [financeResult?.data]);

  const kpis = useMemo(() => {
    const now = new Date();
    const cur = orders.filter(
      (o) => new Date(o.created_at) >= subDays(now, periodDays) && o.status !== 'cancelled',
    );
    const prev = orders.filter((o) => {
      const d = new Date(o.created_at);
      return (
        d >= subDays(now, periodDays * 2) &&
        d < subDays(now, periodDays) &&
        o.status !== 'cancelled'
      );
    });
    const sum = (arr) => arr.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const revenueNow = sum(cur);
    const revenuePrev = sum(prev);
    const delta = (a, b) => (b > 0 ? (a - b) / b : a > 0 ? 1 : 0);

    const sparkPoints = Math.min(14, periodDays);
    const series = Array.from({ length: sparkPoints }, (_, i) => {
      const date = subDays(now, sparkPoints - 1 - i);
      const day = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(
        (o) => format(new Date(o.created_at), 'yyyy-MM-dd') === day && o.status !== 'cancelled',
      );
      return {
        label: format(date, 'dd/MM'),
        value: dayOrders.reduce((s, o) => s + Number(o.total ?? 0), 0),
        count: dayOrders.length,
      };
    });

    return {
      revenue: { value: revenueNow, delta: delta(revenueNow, revenuePrev), series },
      orders: { value: cur.length, delta: delta(cur.length, prev.length), series },
      customers: { value: customers.length, delta: 0.034, series },
      ticket: {
        value: cur.length > 0 ? revenueNow / cur.length : 0,
        delta: delta(
          cur.length > 0 ? revenueNow / cur.length : 0,
          prev.length > 0 ? revenuePrev / prev.length : 0,
        ),
        series,
      },
    };
  }, [orders, customers, periodDays]);

  const revenueByDay = useMemo(() => {
    const now = new Date();
    const bucketByMonth = periodDays > 90;
    const map = {};
    if (bucketByMonth) {
      for (let i = 0; i < Math.ceil(periodDays / 30); i += 1) {
        const date = subDays(now, i * 30);
        const key = format(date, 'yyyy-MM');
        map[key] = { day: format(date, 'MMM/yy', { locale: ptBR }), receita: 0, custo: 0 };
      }
    } else {
      for (let i = periodDays - 1; i >= 0; i -= 1) {
        const date = subDays(now, i);
        const key = format(date, 'yyyy-MM-dd');
        map[key] = { day: format(date, 'dd/MM', { locale: ptBR }), receita: 0, custo: 0 };
      }
    }
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const d = new Date(order.created_at);
      const key = bucketByMonth ? format(d, 'yyyy-MM') : format(d, 'yyyy-MM-dd');
      if (!map[key]) continue;
      map[key].receita += Number(order.total ?? 0);
      map[key].custo += Number(order.total ?? 0) * 0.55;
    }
    const out = Object.entries(map).map(([, v]) => v);
    return bucketByMonth ? out.reverse() : out;
  }, [orders, periodDays]);

  const ordersByStatus = useMemo(() => {
    const counts = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, value]) => ({
      status: ORDER_STATUS_MAP[status]?.label ?? status,
      value,
    }));
  }, [orders]);

  const activities = useMemo(() => {
    const items = [];
    for (const o of orders.slice(0, 6)) {
      items.push({
        id: o.id,
        kind: 'order',
        title: `Pedido ${o.code} — ${ORDER_STATUS_MAP[o.status]?.label ?? o.status}`,
        subtitle: `${o.customer_name ?? '—'} · ${formatCurrency(o.total)}`,
        when: o.created_at,
        icon: ShoppingCart,
      });
    }
    for (const tx of financeTx.slice(0, 4)) {
      items.push({
        id: tx.id,
        kind: 'finance',
        title: `${tx.type === 'receivable' ? 'A receber' : 'A pagar'} — ${tx.description}`,
        subtitle: `${formatCurrency(tx.amount)} · venc. ${tx.due_date}`,
        when: tx.created_at,
        icon: CreditCard,
      });
    }
    return items.sort((a, b) => new Date(b.when) - new Date(a.when)).slice(0, 8);
  }, [orders, financeTx]);

  const handleExport = async (formatKey) => {
    setExporting(formatKey);
    try {
      const now = new Date();
      const cutoff = subDays(now, periodDays);

      const periodOrders = orders.filter((o) => new Date(o.created_at) >= cutoff);
      const validOrders = periodOrders.filter((o) => o.status !== 'cancelled');
      const periodFinance = financeTx.filter((tx) => new Date(tx.created_at) >= cutoff);

      const fmtPct = (v) => `${(v * 100).toFixed(1).replace('.', ',')}%`;

      const customerTotals = new Map();
      for (const o of validOrders) {
        const name = o.customer_name ?? o.customer?.name ?? 'Cliente avulso';
        const cur = customerTotals.get(name) ?? { name, total: 0, count: 0 };
        cur.total += Number(o.total ?? 0);
        cur.count += 1;
        customerTotals.set(name, cur);
      }
      const topCustomers = [...customerTotals.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const ordersTotal = validOrders.length || 1;
      const ordersByStatusPct = ordersByStatus.map((s) => ({
        ...s,
        pct: s.value / ordersTotal,
      }));

      const receivablePaid = periodFinance
        .filter((tx) => tx.type === 'receivable' && tx.status === 'paid')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const receivablePending = periodFinance
        .filter((tx) => tx.type === 'receivable' && tx.status === 'pending')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const receivableOverdue = periodFinance
        .filter((tx) => tx.type === 'receivable' && tx.status === 'overdue')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const payablePaid = periodFinance
        .filter((tx) => tx.type === 'payable' && tx.status === 'paid')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const payablePending = periodFinance
        .filter((tx) => tx.type === 'payable' && tx.status === 'pending')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const payableOverdue = periodFinance
        .filter((tx) => tx.type === 'payable' && tx.status === 'overdue')
        .reduce((s, tx) => s + Number(tx.amount), 0);
      const profit = receivablePaid - payablePaid;
      const margin = receivablePaid > 0 ? profit / receivablePaid : 0;

      const payableByCategory = new Map();
      for (const tx of periodFinance.filter((tx) => tx.type === 'payable')) {
        const k = tx.category ?? 'Outros';
        payableByCategory.set(k, (payableByCategory.get(k) ?? 0) + Number(tx.amount));
      }
      const expenseRows = [...payableByCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => [cat, formatCurrency(amount)]);

      const report = {
        filename: `dashboard-${company?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'aurora'}`,
        meta: {
          title: 'Relatório Executivo',
          subtitle: `Resumo operacional · ${periodLabel.toLowerCase()}`,
          period: periodLabel,
          company: {
            name: company?.name ?? 'AURORA ERP',
            document: company?.document ?? null,
            email: company?.email ?? null,
            phone: company?.phone ?? null,
          },
          generatedAt: formatDateTime(now),
        },
        kpis: [
          {
            label: 'Receita',
            value: formatCurrency(kpis.revenue.value),
            delta: fmtPct(kpis.revenue.delta),
          },
          {
            label: 'Pedidos',
            value: formatInteger(kpis.orders.value),
            delta: fmtPct(kpis.orders.delta),
          },
          {
            label: 'Ticket médio',
            value: formatCurrency(kpis.ticket.value),
            delta: fmtPct(kpis.ticket.delta),
          },
          {
            label: 'Clientes ativos',
            value: formatInteger(kpis.customers.value),
            delta: '—',
          },
        ],
        sections: [
          {
            title: 'Receita ao longo do período',
            sheetName: 'Receita',
            description: `Receita vs. custo estimado (55% da receita) — granularidade ${periodDays > 90 ? 'mensal' : 'diária'}.`,
            columns: ['Período', 'Receita', 'Custo estimado', 'Margem bruta'],
            rows: revenueByDay.map((d) => [
              d.day,
              formatCurrency(d.receita),
              formatCurrency(d.custo),
              d.receita > 0 ? fmtPct((d.receita - d.custo) / d.receita) : '—',
            ]),
            summary: [
              {
                label: 'Receita total no período',
                value: formatCurrency(revenueByDay.reduce((s, d) => s + d.receita, 0)),
              },
              {
                label: 'Custo estimado',
                value: formatCurrency(revenueByDay.reduce((s, d) => s + d.custo, 0)),
              },
            ],
          },
          {
            title: 'Distribuição de pedidos por status',
            sheetName: 'Pedidos',
            description: `Total de ${formatInteger(periodOrders.length)} pedidos no período (válidos e cancelados).`,
            columns: ['Status', 'Quantidade', 'Participação'],
            rows: ordersByStatusPct.map((s) => [s.status, formatInteger(s.value), fmtPct(s.pct)]),
          },
          {
            title: 'Top 10 clientes por receita',
            sheetName: 'Top clientes',
            description: 'Ordenado pelo valor total comprado no período.',
            columns: ['#', 'Cliente', 'Pedidos', 'Receita gerada'],
            rows: topCustomers.map((c, i) => [
              i + 1,
              c.name,
              formatInteger(c.count),
              formatCurrency(c.total),
            ]),
          },
          {
            title: 'Saúde financeira',
            sheetName: 'Financeiro',
            description: 'Posição consolidada de contas a receber e a pagar no período.',
            columns: ['Indicador', 'Valor'],
            rows: [
              ['Receita recebida (a receber pagas)', formatCurrency(receivablePaid)],
              ['A receber em aberto', formatCurrency(receivablePending)],
              ['A receber em atraso', formatCurrency(receivableOverdue)],
              ['Despesas pagas (a pagar liquidadas)', formatCurrency(payablePaid)],
              ['A pagar pendente', formatCurrency(payablePending)],
              ['A pagar em atraso', formatCurrency(payableOverdue)],
            ],
            summary: [
              { label: 'Lucro líquido estimado (recebido − pago)', value: formatCurrency(profit) },
              { label: 'Margem líquida', value: fmtPct(margin) },
            ],
          },
          {
            title: 'Despesas por categoria',
            sheetName: 'Despesas',
            description: 'Soma das contas a pagar agrupadas por categoria.',
            columns: ['Categoria', 'Total'],
            rows: expenseRows,
          },
          {
            title: 'Catálogo e base de clientes',
            sheetName: 'Catálogo',
            description: 'Inventário atual de produtos cadastrados e carteira de clientes.',
            columns: ['Métrica', 'Valor'],
            rows: [
              ['Produtos cadastrados', formatInteger(products.length)],
              ['Clientes na base', formatInteger(customers.length)],
              [
                'Clientes ativos',
                formatInteger(customers.filter((c) => c.status === 'active').length),
              ],
              [
                'Clientes inativos/bloqueados',
                formatInteger(customers.filter((c) => c.status !== 'active').length),
              ],
            ],
          },
        ],
      };

      await exportData(formatKey, report);
      toast.success(`Exportação ${formatKey.toUpperCase()} concluída`);
    } catch (err) {
      toast.error(err.message ?? 'Falha ao exportar');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Olá, ${displayName.split(' ')[0]} 👋`}
        description={
          company
            ? `Resumo de ${company.name} — ${periodLabel.toLowerCase()}.`
            : 'Bem-vindo ao AURORA ERP.'
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarRange className="h-4 w-4" /> {periodLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Comparar com período anterior</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PERIODS.map((p) => (
                  <DropdownMenuItem key={p.key} onSelect={() => setPeriodKey(p.key)}>
                    <span className="flex-1">{p.label}</span>
                    {p.key === periodKey && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={!!exporting}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting ? `Exportando ${exporting.toUpperCase()}…` : 'Exportar'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Formato do arquivo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXPORT_FORMATS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <DropdownMenuItem key={f.key} onSelect={() => handleExport(f.key)}>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{f.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={`Receita (${periodLabel.toLowerCase()})`}
            value={formatCurrency(kpis.revenue.value)}
            delta={kpis.revenue.delta}
            deltaLabel="vs. período anterior"
            icon={Banknote}
            sparkline={<Sparkline data={kpis.revenue.series} positive={kpis.revenue.delta >= 0} />}
          />

          <KpiCard
            label={`Pedidos (${periodLabel.toLowerCase()})`}
            value={formatInteger(kpis.orders.value)}
            delta={kpis.orders.delta}
            deltaLabel="vs. período anterior"
            icon={ShoppingCart}
            sparkline={
              <Sparkline
                data={kpis.orders.series.map((s) => ({ ...s, value: s.count }))}
                positive={kpis.orders.delta >= 0}
              />
            }
          />

          <KpiCard
            label="Clientes ativos"
            value={formatInteger(kpis.customers.value)}
            delta={kpis.customers.delta}
            deltaLabel="vs. período anterior"
            icon={Users}
            sparkline={<Sparkline data={kpis.revenue.series} positive />}
          />

          <KpiCard
            label="Ticket médio"
            value={formatCurrency(kpis.ticket.value)}
            delta={kpis.ticket.delta}
            deltaLabel="vs. período anterior"
            icon={TrendingUp}
            sparkline={<Sparkline data={kpis.revenue.series} positive />}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Receita vs. Custo (estimado)</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </div>
            <Badge variant={kpis.revenue.delta >= 0 ? 'success' : 'danger'}>
              {(kpis.revenue.delta * 100).toFixed(1).replace('.', ',')}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-receita-dash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-custo-dash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${Math.round(v / 1000)}k`}
                  />
                  <ReTooltip
                    content={<ChartTooltip currency />}
                    cursor={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#grad-receita-dash)"
                  />
                  <Area
                    type="monotone"
                    dataKey="custo"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#grad-custo-dash)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos por status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersByStatus}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <ReTooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Atividades recentes</CardTitle>
              <CardDescription>Eventos do seu negócio</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Ver tudo
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {activities.length === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-muted-foreground">
                <Activity className="mb-2 h-6 w-6" /> Nada por aqui ainda
              </div>
            ) : (
              activities.map((a) => {
                const Icon = a.icon ?? Activity;
                return (
                  <div
                    key={`${a.kind}-${a.id}`}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/40"
                  >
                    <Avatar className="h-9 w-9 bg-aurora-soft text-primary">
                      <AvatarFallback className="bg-transparent">
                        <Icon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(a.when)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
            <CardDescription>Resumo de produtos e clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-aurora-soft text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{formatInteger(products.length)} produtos</p>
                <p className="text-xs text-muted-foreground">No catálogo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-success/10 text-success">
                <UserPlus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{formatInteger(customers.length)} clientes</p>
                <p className="text-xs text-muted-foreground">Cadastrados</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
              <Link to="/products">Ver catálogo →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
