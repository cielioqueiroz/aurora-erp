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
import { useOrderDetail, useUpdateOrderStatus } from '../hooks/useOrders';
import { ORDER_STATUS_MAP } from '../constants';
import { formatCurrency, formatDate, formatDateTime, formatDocument, formatInteger } from '@/lib/formatters';
import { toast } from '@/components/ui/toast';

export function OrderDetailSheet({ orderId, open, onOpenChange }) {
  const { data: order, isLoading } = useOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (status) => {
    updateStatus.mutate({ id: orderId, status }, {
      onSuccess: () => toast.success('Status atualizado'),
      onError: (err) => toast.error(err.message ?? 'Erro'),
    });
  };

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
                  <SheetDescription>
                    Criado em {formatDateTime(order.created_at)}
                  </SheetDescription>
                </div>
                <Badge variant={ORDER_STATUS_MAP[order.status]?.variant ?? 'secondary'}>
                  {ORDER_STATUS_MAP[order.status]?.label ?? order.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Cliente */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </h3>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-medium">{order.customer?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer?.document ? formatDocument(order.customer.document) : ''}
                    {order.customer?.email && ` · ${order.customer.email}`}
                  </p>
                </div>
              </section>

              {/* Itens */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Itens
                </h3>
                <div className="rounded-lg border border-border">
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
                            {formatInteger(item.quantity)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* Totais */}
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

              {/* Pagamentos */}
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
                          <p className="font-medium capitalize">{p.method}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.paid_at ? `Pago em ${formatDate(p.paid_at)}` : 'Pendente'}
                          </p>
                        </div>
                        <span className="tabular-nums font-semibold">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Alterar status:</span>
                <Select value={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS_MAP).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
