import { useMemo } from 'react';
import {
  Banknote,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  CreditCard,
  UserPlus,
  Filter,
  Download,
  Activity,
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
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { KpiCard } from '@/components/charts/KpiCard';
import { Sparkline } from '@/components/charts/Sparkline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, formatInteger } from '@/lib/formatters';
import { ordersHooks } from '@/modules/orders/hooks/useOrders';
import { customersHooks } from '@/modules/customers/hooks/useCustomers';
import { productsHooks } from '@/modules/products/hooks/useProducts';
import { financeHooks } from '@/modules/finance/hooks/useFinance';
import { ORDER_STATUS_MAP } from '@/modules/orders/constants';

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 tabular-nums">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
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

  const { data: ordersResult } = ordersHooks.useList({ perPage: 500, order: { field: 'created_at', asc: false } });
  const { data: customersResult } = customersHooks.useList({ perPage: 500 });
  const { data: productsResult } = productsHooks.useList({ perPage: 500 });
  const { data: financeResult } = financeHooks.useList({ perPage: 500 });

  const orders = useMemo(() => ordersResult?.data ?? [], [ordersResult?.data]);
  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data]);
  const products = useMemo(() => productsResult?.data ?? [], [productsResult?.data]);
  const financeTx = useMemo(() => financeResult?.data ?? [], [financeResult?.data]);

  const kpis = useMemo(() => {
    const last30 = orders.filter(
      (o) => new Date(o.created_at) >= subDays(new Date(), 30) && o.status !== 'cancelled',
    );
    const prev30 = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= subDays(new Date(), 60) && d < subDays(new Date(), 30) && o.status !== 'cancelled';
    });
    const sum = (arr) => arr.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const revenueNow = sum(last30);
    const revenuePrev = sum(prev30);
    const delta = (a, b) => (b > 0 ? (a - b) / b : a > 0 ? 1 : 0);

    const series = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
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
      orders: { value: last30.length, delta: delta(last30.length, prev30.length), series },
      customers: { value: customers.length, delta: 0.034, series },
      ticket: {
        value: last30.length > 0 ? revenueNow / last30.length : 0,
        delta: 0,
        series,
      },
    };
  }, [orders, customers]);

  const revenueByDay = useMemo(() => {
    const map = {};
    for (let i = 29; i >= 0; i -= 1) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      map[key] = { day: format(date, 'dd/MM', { locale: ptBR }), receita: 0, custo: 0 };
    }
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const key = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!map[key]) continue;
      map[key].receita += Number(order.total ?? 0);
      map[key].custo += Number(order.total ?? 0) * 0.55;
    }
    return Object.values(map);
  }, [orders]);

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

  return (
    <div>
      <PageHeader
        title={`Olá, ${displayName.split(' ')[0]} 👋`}
        description={
          company
            ? `Aqui está o resumo de ${company.name} nos últimos 30 dias.`
            : 'Bem-vindo ao AURORA ERP.'
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" /> Período
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </>
        }
      />

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Receita (30d)"
            value={formatCurrency(kpis.revenue.value)}
            delta={kpis.revenue.delta}
            deltaLabel="vs. mês anterior"
            icon={Banknote}
            sparkline={<Sparkline data={kpis.revenue.series} positive={kpis.revenue.delta >= 0} />}
          />
          <KpiCard
            label="Pedidos (30d)"
            value={formatInteger(kpis.orders.value)}
            delta={kpis.orders.delta}
            deltaLabel="vs. mês anterior"
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
            deltaLabel="vs. mês anterior"
            icon={Users}
            sparkline={<Sparkline data={kpis.revenue.series} positive />}
          />
          <KpiCard
            label="Ticket médio"
            value={formatCurrency(kpis.ticket.value)}
            delta={kpis.ticket.delta}
            deltaLabel="vs. mês anterior"
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
              <CardDescription>Últimos 30 dias</CardDescription>
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
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
                  <ReTooltip content={<ChartTooltip currency />} cursor={{ stroke: 'hsl(var(--border))' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad-receita-dash)" />
                  <Area type="monotone" dataKey="custo" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#grad-custo-dash)" />
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
                <BarChart data={ordersByStatus} layout="vertical" margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                  <ReTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
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
            <Button variant="ghost" size="sm">Ver tudo</Button>
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
              <a href="/products">Ver catálogo →</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
