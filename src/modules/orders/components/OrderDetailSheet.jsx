import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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
import {
  useOrderDetail,
  useConfirmOrder,
  useCancelOrder,
  usePayOrder,
  useRefundOrder,
} from '../hooks/useOrders';
import { ORDER_STATUS_MAP } from '../constants';
import { PAYMENT_METHODS } from '@/validations/order';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDocument,
  formatNumber,
} from '@/lib/formatters';
import { toast } from '@/components/ui/toast';

function PaymentAction({ orderId, disabled }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('pix');
  const payOrder = usePayOrder();

  const submit = () => {
    payOrder.mutate(
      { id: orderId, method },
      {
        onSuccess: () => {
          toast.success('Pagamento registrado');
          setOpen(false);
        },
        onError: (err) => toast.error(err.message ?? 'Não foi possível registrar o pagamento'),
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" disabled={disabled}>
          Registrar pagamento
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-method">Forma de pagamento</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger id="payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="w-full" onClick={submit} disabled={payOrder.isPending}>
          Confirmar recebimento
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function OrderActions({ order }) {
  const canUpdate = usePermission(PERMISSIONS.ORDERS_UPDATE);
  const canCancel = usePermission(PERMISSIONS.ORDERS_CANCEL);
  const canRefund = usePermission(PERMISSIONS.ORDERS_REFUND);

  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const refundOrder = useRefundOrder();

  const run = (mutation, successMessage) => {
    mutation.mutate(
      { id: order.id },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (err) => toast.error(err.message ?? 'Não foi possível concluir a operação'),
      },
    );
  };

  const busy = confirmOrder.isPending || cancelOrder.isPending || refundOrder.isPending;

  if (order.status === 'cancelled' || order.status === 'refunded') {
    return (
      <p className="text-xs text-muted-foreground">
        Este pedido está encerrado. Nenhuma outra transição é possível.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {order.status === 'draft' && canUpdate && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => run(confirmOrder, `Pedido ${order.code} confirmado`)}
        >
          Confirmar pedido
        </Button>
      )}

      {order.status === 'confirmed' && canUpdate && (
        <PaymentAction orderId={order.id} disabled={busy} />
      )}

      {(order.status === 'draft' || order.status === 'confirmed') &&
        (canCancel ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(cancelOrder, `Pedido ${order.code} cancelado`)}
          >
            Cancelar pedido
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cancelar exige a permissão <span className="font-mono">orders.cancel</span>.
          </p>
        ))}

      {order.status === 'paid' &&
        (canRefund ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => run(refundOrder, `Pedido ${order.code} reembolsado`)}
          >
            Reembolsar
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Reembolsar exige a permissão <span className="font-mono">orders.refund</span>.
          </p>
        ))}
    </div>
  );
}

export function OrderDetailSheet({ orderId, open, onOpenChange }) {
  const { data: order, isLoading } = useOrderDetail(orderId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        {isLoading ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !order ? (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            Pedido não encontrado.
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="font-mono text-lg">{order.code}</SheetTitle>
                  <SheetDescription>Criado em {formatDateTime(order.created_at)}</SheetDescription>
                </div>
                <Badge variant={ORDER_STATUS_MAP[order.status]?.variant ?? 'secondary'}>
                  {ORDER_STATUS_MAP[order.status]?.label ?? order.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </h3>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-medium">{order.customer?.name ?? 'Venda sem identificação'}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer?.document ? formatDocument(order.customer.document) : ''}
                    {order.customer?.email && ` · ${order.customer.email}`}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Itens
                </h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order.items ?? []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name ?? item.product_id}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(item.quantity)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="tabular-nums">− {formatCurrency(order.discount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(order.total)}</span>
                </div>
              </section>

              {(order.payments ?? []).length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pagamentos
                  </h3>
                  <div className="space-y-2">
                    {order.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.paid_at ? `Pago em ${formatDate(p.paid_at)}` : 'Pendente'}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3">
              <OrderActions order={order} />
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
