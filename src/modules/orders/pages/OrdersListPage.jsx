import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, ShoppingCart } from 'lucide-react';
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/tables/DataTable';
import { DataTableToolbar } from '@/components/tables/DataTableToolbar';
import { RowActions } from '@/components/tables/RowActions';
import { currencyColumn, dateColumn, actionsColumn } from '@/components/tables/columnHelpers';
import { useDebounce } from '@/hooks/useDebounce';
import { ordersHooks } from '../hooks/useOrders';
import { ORDER_STATUS_MAP } from '../constants';
import { OrderDetailSheet } from '../components/OrderDetailSheet';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';

export function OrdersListPage() {
  const navigate = useNavigate();
  const [{ page, perPage, search, status, sort, asc }, setQueryStates] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(20),
      search: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      sort: parseAsString.withDefault('created_at'),
      asc: parseAsInteger.withDefault(0),
    },
    { history: 'replace' },
  );

  const debouncedSearch = useDebounce(search, 300);
  const { data: result, isLoading } = ordersHooks.useList({
    page,
    perPage,
    search: debouncedSearch,
    searchField: 'code',
    filters: status ? { status } : {},
    order: { field: sort, asc: asc === 1 },
  });
  const orders = result?.data ?? [];
  const total = result?.count ?? 0;

  const [detailId, setDetailId] = useState(null);

  const handleSort = (field) => {
    if (sort === field) setQueryStates({ asc: asc === 1 ? 0 : 1, page: 1 });
    else setQueryStates({ sort: field, asc: 1, page: 1 });
  };

  const columns = useMemo(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        header: 'Código',
        meta: { sortable: true },
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium tabular-nums">{getValue()}</span>
        ),

        size: 110,
      },
      {
        id: 'customer_name',
        accessorKey: 'customer_name',
        header: 'Cliente',
        cell: ({ getValue }) => <span className="font-medium">{getValue() ?? '—'}</span>,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const cfg = ORDER_STATUS_MAP[getValue()] ?? { label: getValue(), variant: 'secondary' };
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      currencyColumn({ id: 'total', header: 'Total', accessor: 'total' }),
      dateColumn({ id: 'created_at', header: 'Criado em', accessor: 'created_at' }),
      actionsColumn((order) => (
        <RowActions>
          <DropdownMenuItem onSelect={() => setDetailId(order.id)}>
            <Eye className="h-4 w-4" /> Ver detalhes
          </DropdownMenuItem>
        </RowActions>
      )),
    ],

    [],
  );

  return (
    <div>
      <PageHeader title="Pedidos" description={`${total} pedido${total === 1 ? '' : 's'}`} />

      <DataTable
        columns={columns}
        data={orders}
        total={total}
        loading={isLoading}
        page={page}
        perPage={perPage}
        sort={{ field: sort, asc: asc === 1 }}
        onSortChange={handleSort}
        onPageChange={(p) => setQueryStates({ page: p })}
        onPerPageChange={(pp) => setQueryStates({ perPage: pp, page: 1 })}
        emptyState={{ icon: ShoppingCart, title: 'Nenhum pedido ainda' }}
        toolbar={
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => setQueryStates({ search: v, page: 1 })}
            placeholder="Buscar por código…"
            filters={
              <Select
                value={status || 'all'}
                onValueChange={(v) => setQueryStates({ status: v === 'all' ? '' : v, page: 1 })}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {Object.entries(ORDER_STATUS_MAP).map(([k, cfg]) => (
                    <SelectItem key={k} value={k}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            actions={
              <Can permission={PERMISSIONS.ORDERS_CREATE}>
                <Button onClick={() => navigate(ROUTES.ORDER_NEW)}>
                  <Plus className="h-4 w-4" />
                  Novo pedido
                </Button>
              </Can>
            }
          />
        }
      />

      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  );
}
