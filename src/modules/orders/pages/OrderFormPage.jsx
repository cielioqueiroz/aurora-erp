import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, UserRound, UserRoundX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/constants/routes';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import { customersHooks } from '@/modules/customers/hooks/useCustomers';
import { useCreateOrder, useSellableProducts } from '../hooks/useOrders';
import { ProductPicker } from '../components/ProductPicker';
import {
  PAYMENT_TERMS,
  calculateItemTotal,
  calculateOrderTotals,
  dueDateFromTerm,
} from '@/validations/order';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';

const WALK_IN = 'walk-in';

export function OrderFormPage() {
  const navigate = useNavigate();
  const canCreate = usePermission(PERMISSIONS.ORDERS_CREATE);

  const { data: productsData, isLoading: loadingProducts } = useSellableProducts();
  const { data: customersData } = customersHooks.useList({ perPage: 100 });
  const createOrder = useCreateOrder();

  const [lines, setLines] = useState([]);
  const [customerId, setCustomerId] = useState(WALK_IN);
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [term, setTerm] = useState('0');
  const [notes, setNotes] = useState('');

  const products = productsData ?? [];
  const customers = customersData?.data ?? [];
  const selectedIds = lines.map((line) => line.product_id);

  const totals = useMemo(
    () =>
      calculateOrderTotals(
        lines.map((line) => ({
          quantity: line.quantity,
          unitPrice: line.unit_price,
          discount: line.discount,
        })),
        Number(orderDiscount || 0),
      ),
    [lines, orderDiscount],
  );

  const overstocked = lines.filter((line) => Number(line.quantity) > line.balance);
  const discountTooBig = totals.total < 0;
  const canSubmit = lines.length > 0 && !discountTooBig && !createOrder.isPending;

  const addProduct = (product) => {
    setLines((prev) => [
      ...prev,
      {
        product_id: product.product_id,
        name: product.product_name,
        sku: product.sku,
        unit_price: Number(product.price),
        balance: Number(product.balance),
        quantity: '1',
        discount: '0',
      },
    ]);
  };

  const updateLine = (productId, patch) => {
    setLines((prev) =>
      prev.map((line) => (line.product_id === productId ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (productId) => {
    setLines((prev) => prev.filter((line) => line.product_id !== productId));
  };

  const submit = (confirm) => {
    createOrder.mutate(
      {
        items: lines.map((line) => ({
          product_id: line.product_id,
          quantity: Number(line.quantity || 0),
          discount: Number(line.discount || 0),
        })),
        customerId: customerId === WALK_IN ? null : customerId,
        discount: Number(orderDiscount || 0),
        notes,
        dueDate: confirm ? dueDateFromTerm(term) : null,
        confirm,
      },
      {
        onSuccess: (order) => {
          toast.success(
            confirm ? `Pedido ${order.code} confirmado` : `Rascunho ${order.code} salvo`,
          );
          navigate(ROUTES.ORDERS);
        },
        onError: (err) => toast.error(err.message ?? 'Não foi possível registrar o pedido'),
      },
    );
  };

  if (!canCreate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Novo pedido" />
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para criar pedidos. Peça a um administrador a permissão
          <span className="ml-1 font-mono text-xs">orders.create</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo pedido"
        description="Confirmar o pedido dá baixa no estoque e gera a cobrança no financeiro."
        actions={
          <Button variant="ghost" onClick={() => navigate(ROUTES.ORDERS)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="surface-panel rounded-lg p-4">
            <Label htmlFor="customer">Cliente</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer" className="w-full sm:w-[320px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WALK_IN}>
                    <span className="flex items-center gap-2">
                      <UserRoundX className="h-4 w-4" />
                      Venda sem identificação
                    </span>
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <span className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {customer.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="surface-panel overflow-hidden rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="text-sm font-semibold">Itens</h2>
                <p className="text-xs text-muted-foreground">
                  O preço vem do cadastro do produto. Para abater valor, use o desconto.
                </p>
              </div>
              <ProductPicker
                products={products}
                selectedIds={selectedIds}
                onSelect={addProduct}
                disabled={loadingProducts}
              />
            </div>

            {lines.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum item ainda. Adicione um produto para começar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-[110px] text-right">Qtd</TableHead>
                    <TableHead className="w-[120px] text-right">Unit.</TableHead>
                    <TableHead className="w-[130px] text-right">Desconto</TableHead>
                    <TableHead className="w-[130px] text-right">Total</TableHead>
                    <TableHead className="w-[52px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => {
                    const insufficient = Number(line.quantity) > line.balance;
                    return (
                      <TableRow key={line.product_id}>
                        <TableCell>
                          <span className="block text-sm font-medium">{line.name}</span>
                          <span
                            className={cn(
                              'block font-mono text-xs',
                              insufficient ? 'text-destructive' : 'text-muted-foreground',
                            )}
                          >
                            {line.sku ?? 'sem SKU'} · saldo {formatNumber(line.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="decimal"
                            value={line.quantity}
                            aria-label={`Quantidade de ${line.name}`}
                            onChange={(e) =>
                              updateLine(line.product_id, { quantity: e.target.value })
                            }
                            className="h-8 text-right tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {formatCurrency(line.unit_price)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={line.discount}
                            aria-label={`Desconto de ${line.name}`}
                            onChange={(e) =>
                              updateLine(line.product_id, { discount: e.target.value })
                            }
                            className="h-8 text-right tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {formatCurrency(
                            calculateItemTotal({
                              quantity: line.quantity,
                              unitPrice: line.unit_price,
                              discount: line.discount,
                            }),
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remover ${line.name}`}
                            onClick={() => removeLine(line.product_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="surface-panel rounded-lg p-4">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Combinações, referências ou instruções de entrega (opcional)"
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="surface-panel sticky top-4 space-y-4 rounded-lg p-4">
            <div className="space-y-1.5">
              <Label htmlFor="term">Condição de pagamento</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vence em {new Date(dueDateFromTerm(term) + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="order-discount">Desconto no pedido</Label>
              <Input
                id="order-discount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>

            <Separator />

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd className="tabular-nums">− {formatCurrency(totals.discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(totals.total)}</dd>
              </div>
            </dl>

            {discountTooBig && (
              <p className="text-xs font-medium text-destructive">
                O desconto do pedido é maior que o subtotal.
              </p>
            )}

            {overstocked.length > 0 && (
              <p className="text-xs font-medium text-destructive">
                Sem saldo para {overstocked.map((line) => line.name).join(', ')}. Registre a entrada
                em Estoque ou reduza a quantidade.
              </p>
            )}

            <div className="grid gap-2">
              <Button
                type="button"
                disabled={!canSubmit || overstocked.length > 0}
                onClick={() => submit(true)}
              >
                Confirmar pedido
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canSubmit}
                onClick={() => submit(false)}
              >
                Salvar rascunho
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
