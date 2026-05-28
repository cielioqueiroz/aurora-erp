import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Loader2,
  Plus,
  Settings2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/forms/FormField';
import { CrudSheet } from '@/components/forms/CrudSheet';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime, formatInteger } from '@/lib/formatters';
import { useStockBalance, useInventoryMovements, useCreateMovement } from '../hooks/useInventory';
import { productsHooks } from '@/modules/products/hooks/useProducts';
import { cn } from '@/lib/cn';

const movementSchema = z.object({
  product_id: z.string().uuid('Selecione um produto'),
  type: z.enum(['in', 'out', 'adjust']),
  quantity: z.coerce.number().refine((v) => v !== 0, 'Quantidade não pode ser zero'),
  unit_cost: z.coerce.number().min(0).optional(),
  reason: z.string().max(200).optional().or(z.literal('')),
});

function MovementForm({ formId, products, onSubmit }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: { product_id: '', type: 'in', quantity: 1, unit_cost: 0, reason: '' },
  });

  const type = watch('type');
  const productId = watch('product_id');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Produto" error={errors.product_id?.message} required>
        <Select value={productId || ''} onValueChange={(v) => setValue('product_id', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo" error={errors.type?.message}>
          <Select value={type} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Entrada</SelectItem>
              <SelectItem value="out">Saída</SelectItem>
              <SelectItem value="adjust">Ajuste</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Quantidade" error={errors.quantity?.message} required>
          <Input type="number" step="0.001" {...register('quantity')} />
        </FormField>
      </div>

      <FormField
        label="Custo unitário (R$)"
        description="Apenas para entradas. Opcional."
        error={errors.unit_cost?.message}
      >
        <Input type="number" step="0.01" min="0" {...register('unit_cost')} disabled={type !== 'in'} />
      </FormField>

      <FormField label="Motivo" error={errors.reason?.message}>
        <Textarea rows={2} {...register('reason')} placeholder="Compra, venda, perda, etc." />
      </FormField>
    </form>
  );
}

function MovementTypeBadge({ type }) {
  const map = {
    in:     { label: 'Entrada', variant: 'success', icon: ArrowDownToLine },
    out:    { label: 'Saída',   variant: 'warning', icon: ArrowUpFromLine },
    adjust: { label: 'Ajuste',  variant: 'info',    icon: Settings2 },
  };
  const cfg = map[type] ?? map.adjust;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

export function InventoryPage() {
  const { data: balance, isLoading: balanceLoading } = useStockBalance();
  const { data: movementsResult, isLoading: movementsLoading } = useInventoryMovements({ perPage: 50 });
  const { data: productsResult } = productsHooks.useList({ perPage: 200 });
  const products = useMemo(() => productsResult?.data ?? [], [productsResult?.data]);
  const movements = movementsResult?.data ?? [];

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const createMutation = useCreateMovement();

  const lowStockItems = useMemo(
    () => (balance ?? []).filter((b) => b.balance < (b.stock_min ?? 0)),
    [balance],
  );
  const totalStockValue = useMemo(
    () =>
      (balance ?? []).reduce(
        (sum, b) => sum + Number(b.balance ?? 0) * Number(b.product?.cost ?? 0),
        0,
      ),
    [balance],
  );

  const handleCreate = (payload) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Movimentação registrada');
        setSheetOpen(false);
      },
      onError: (err) => toast.error(err.message ?? 'Erro ao registrar'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Saldos por produto, alertas de mínimo e histórico de movimentações."
        actions={
          <Can permission={PERMISSIONS.INVENTORY_MOVE}>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4" /> Nova movimentação
            </Button>
          </Can>
        }
      />

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Itens em estoque
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatInteger(balance?.length ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Valor total (a custo)
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCurrency(totalStockValue)}
              </p>
            </CardContent>
          </Card>
          <Card className={cn(lowStockItems.length > 0 && 'border-warning/50 bg-warning/5')}>
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {lowStockItems.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                Abaixo do mínimo
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatInteger(lowStockItems.length)}
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Tabs defaultValue="balance">
        <TabsList>
          <TabsTrigger value="balance">Saldos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <div className="rounded-xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Valor (custo)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : balance && balance.length > 0 ? (
                  balance.map((row) => {
                    const low = row.balance < (row.stock_min ?? 0);
                    return (
                      <TableRow key={row.product.id}>
                        <TableCell>
                          <p className="font-medium">{row.product.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{row.product.sku ?? '—'}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatInteger(row.balance)} {row.product.unit}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatInteger(row.stock_min ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(Number(row.balance) * Number(row.product.cost ?? 0))}
                        </TableCell>
                        <TableCell>
                          {low ? (
                            <Badge variant="warning">Abaixo do mínimo</Badge>
                          ) : (
                            <Badge variant="success">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={5}><EmptyState icon={Boxes} title="Sem produtos ainda" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <div className="rounded-xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : movements.length > 0 ? (
                  movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDateTime(mov.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {productById[mov.product_id]?.name ?? mov.product_id}
                      </TableCell>
                      <TableCell><MovementTypeBadge type={mov.type} /></TableCell>
                      <TableCell className="text-right tabular-nums">
                        {mov.type === 'out' ? '−' : '+'}{formatInteger(mov.quantity)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{mov.reason ?? '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5}><EmptyState title="Sem movimentações" /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Nova movimentação"
        description="Registre entrada, saída ou ajuste de estoque."
        submitLabel="Registrar"
        loading={createMutation.isPending}
        onSubmit={() => document.getElementById('movement-form')?.requestSubmit()}
      >
        <MovementForm formId="movement-form" products={products} onSubmit={handleCreate} />
      </CrudSheet>

      {createMutation.isPending && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-card px-3 py-2 text-xs shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
        </div>
      )}
    </div>
  );
}
