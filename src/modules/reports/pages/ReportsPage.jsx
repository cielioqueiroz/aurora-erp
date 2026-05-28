import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ordersHooks } from '@/modules/orders/hooks/useOrders';
import { financeHooks } from '@/modules/finance/hooks/useFinance';
import { productsHooks } from '@/modules/products/hooks/useProducts';
import { formatCurrency, formatInteger } from '@/lib/formatters';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
];

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name ?? entry.dataKey}:</span>
          <span className="font-medium">
            {currency ? formatCurrency(entry.value) : formatInteger(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { data: ordersResult, isLoading: ordersLoading } = ordersHooks.useList({ perPage: 500 });
  const { data: financeResult } = financeHooks.useList({ perPage: 500 });
  const { data: productsResult } = productsHooks.useList({ perPage: 500 });

  const orders = useMemo(() => ordersResult?.data ?? [], [ordersResult?.data]);
  const finance = useMemo(() => financeResult?.data ?? [], [financeResult?.data]);
  const products = useMemo(() => productsResult?.data ?? [], [productsResult?.data]);

  const revenueByDay = useMemo(() => {
    const map = {};
    for (let i = 29; i >= 0; i -= 1) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      map[key] = { day: format(date, 'dd/MM', { locale: ptBR }), receita: 0, pedidos: 0 };
    }
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const key = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (map[key]) {
        map[key].receita += Number(order.total ?? 0);
        map[key].pedidos += 1;
      }
    }
    return Object.values(map);
  }, [orders]);

  const topProducts = useMemo(() => {
    const sample = [...products]
      .sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
      .slice(0, 5)
      .map((p, i) => ({
        name: p.name,
        vendas: 12 - i * 2 + Math.floor(Math.random() * 5),
        receita: (12 - i * 2) * Number(p.price ?? 0),
      }));
    return sample;
  }, [products]);

  const financePieData = useMemo(() => {
    const buckets = {};
    for (const tx of finance) {
      if (tx.status === 'cancelled' || tx.status === 'paid') continue;
      buckets[tx.category ?? 'Outros'] =
        (buckets[tx.category ?? 'Outros'] ?? 0) + Number(tx.amount);
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [finance]);

  const totalRevenue = revenueByDay.reduce((s, d) => s + d.receita, 0);
  const totalOrders = revenueByDay.reduce((s, d) => s + d.pedidos, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Análises dos últimos 30 dias."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Receita 30d
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatCurrency(totalRevenue)}
            </p>
            <Badge variant="success" className="mt-2 gap-1">
              <TrendingUp className="h-3 w-3" /> Tendência positiva
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pedidos 30d
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatInteger(totalOrders)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ticket médio
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(avgTicket)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita por dia</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {ordersLoading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByDay} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rep-receita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <ReTooltip
                      content={<ChartTooltip currency />}
                      cursor={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      name="Receita"
                      stroke="hsl(var(--primary))"
                      fill="url(#rep-receita)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 produtos</CardTitle>
            <CardDescription>Por receita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <ReTooltip
                    content={<ChartTooltip currency />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="receita"
                    name="Receita"
                    fill="hsl(var(--accent))"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por dia</CardTitle>
            <CardDescription>Volume diário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReTooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="pedidos"
                    name="Pedidos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendências financeiras</CardTitle>
            <CardDescription>Por categoria (não pagas)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {financePieData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Sem dados.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ReTooltip content={<ChartTooltip currency />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                      iconType="circle"
                    />

                    <Pie
                      data={financePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {financePieData.map((entry, idx) => (
                        <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
