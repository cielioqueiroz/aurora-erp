import { useMemo, useState } from 'react';
import {
  Pencil,
  Plus,
  Trash2,
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/tables/DataTable';
import { DataTableToolbar } from '@/components/tables/DataTableToolbar';
import { RowActions } from '@/components/tables/RowActions';
import { currencyColumn, dateColumn, actionsColumn } from '@/components/tables/columnHelpers';
import { CrudSheet } from '@/components/forms/CrudSheet';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { financeHooks } from '../hooks/useFinance';
import { FinanceForm } from '../components/FinanceForm';
import { formatCurrency } from '@/lib/formatters';

const STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'success' },
  overdue: { label: 'Vencido', variant: 'danger' },
  cancelled: { label: 'Cancelado', variant: 'warning' },
};

const TYPE_MAP = {
  receivable: { label: 'A receber', variant: 'success' },
  payable: { label: 'A pagar', variant: 'danger' },
};

export function FinancePage() {
  const [{ page, perPage, search, type, status, sort, asc }, setQueryStates] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(20),
      search: parseAsString.withDefault(''),
      type: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      sort: parseAsString.withDefault('due_date'),
      asc: parseAsInteger.withDefault(1),
    },
    { history: 'replace' },
  );

  const debouncedSearch = useDebounce(search, 300);
  const filters = useMemo(() => {
    const f = {};
    if (type) f.type = type;
    if (status) f.status = status;
    return f;
  }, [type, status]);

  const { data: result, isLoading } = financeHooks.useList({
    page,
    perPage,
    search: debouncedSearch,
    searchField: 'description',
    filters,
    order: { field: sort, asc: asc === 1 },
  });

  const transactions = result?.data ?? [];
  const total = result?.count ?? 0;

  const { data: allResult } = financeHooks.useList({ perPage: 1000 });
  const kpis = useMemo(() => {
    let receivablePending = 0,
      payablePending = 0,
      overdue = 0;
    for (const tx of allResult?.data ?? []) {
      if (tx.status === 'paid') continue;
      if (tx.status === 'overdue') overdue += Number(tx.amount);
      if (tx.type === 'receivable') receivablePending += Number(tx.amount);
      else if (tx.type === 'payable') payablePending += Number(tx.amount);
    }
    return { receivablePending, payablePending, overdue, net: receivablePending - payablePending };
  }, [allResult?.data]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const createMutation = financeHooks.useCreate({
    onSuccess: () => {
      toast.success('Lançamento criado');
      setSheetOpen(false);
    },
    onError: (err) => toast.error(err.message ?? 'Erro'),
  });
  const updateMutation = financeHooks.useUpdate({
    onSuccess: () => {
      toast.success('Lançamento atualizado');
      setSheetOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(err.message ?? 'Erro'),
  });
  const deleteMutation = financeHooks.useDelete({
    onSuccess: () => {
      toast.success('Lançamento excluído');
      setDeleting(null);
    },
    onError: (err) => toast.error(err.message ?? 'Erro'),
  });

  const handleSort = (field) => {
    if (sort === field) setQueryStates({ asc: asc === 1 ? 0 : 1, page: 1 });
    else setQueryStates({ sort: field, asc: 1, page: 1 });
  };

  const handleSubmit = (payload) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const columns = useMemo(
    () => [
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Descrição',
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.description}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.category ?? '—'}</p>
          </div>
        ),
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const cfg = TYPE_MAP[getValue()];
          return <Badge variant={cfg?.variant}>{cfg?.label ?? getValue()}</Badge>;
        },
      },
      currencyColumn({ id: 'amount', header: 'Valor', accessor: 'amount' }),
      dateColumn({ id: 'due_date', header: 'Vencimento', accessor: 'due_date' }),
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const cfg = STATUS_MAP[getValue()];
          return <Badge variant={cfg?.variant}>{cfg?.label ?? getValue()}</Badge>;
        },
      },
      actionsColumn((tx) => (
        <RowActions>
          <Can permission={PERMISSIONS.FINANCE_UPDATE}>
            <DropdownMenuItem
              onSelect={() => {
                setEditing(tx);
                setSheetOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
          </Can>
          <Can permission={PERMISSIONS.FINANCE_DELETE}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleting(tx)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </Can>
        </RowActions>
      )),
    ],

    [],
  );

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar e a receber."
        actions={
          <Can permission={PERMISSIONS.FINANCE_CREATE}>
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Novo lançamento
            </Button>
          </Can>
        }
      />

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiSimple
            label="A receber"
            value={formatCurrency(kpis.receivablePending)}
            icon={TrendingUp}
            tone="success"
          />
          <KpiSimple
            label="A pagar"
            value={formatCurrency(kpis.payablePending)}
            icon={TrendingDown}
            tone="danger"
          />
          <KpiSimple
            label="Vencidos"
            value={formatCurrency(kpis.overdue)}
            icon={CalendarClock}
            tone="warning"
          />
          <KpiSimple
            label="Saldo previsto"
            value={formatCurrency(kpis.net)}
            icon={Wallet}
            tone={kpis.net >= 0 ? 'success' : 'danger'}
          />
        </div>
      </Section>

      <DataTable
        columns={columns}
        data={transactions}
        total={total}
        loading={isLoading}
        page={page}
        perPage={perPage}
        sort={{ field: sort, asc: asc === 1 }}
        onSortChange={handleSort}
        onPageChange={(p) => setQueryStates({ page: p })}
        onPerPageChange={(pp) => setQueryStates({ perPage: pp, page: 1 })}
        emptyState={{ icon: Wallet, title: 'Nenhum lançamento' }}
        toolbar={
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => setQueryStates({ search: v, page: 1 })}
            placeholder="Buscar por descrição…"
            filters={
              <>
                <Select
                  value={type || 'all'}
                  onValueChange={(v) => setQueryStates({ type: v === 'all' ? '' : v, page: 1 })}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    <SelectItem value="receivable">A receber</SelectItem>
                    <SelectItem value="payable">A pagar</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={status || 'all'}
                  onValueChange={(v) => setQueryStates({ status: v === 'all' ? '' : v, page: 1 })}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    {Object.entries(STATUS_MAP).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        }
      />

      <CrudSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? 'Editar lançamento' : 'Novo lançamento'}
        submitLabel={editing ? 'Salvar' : 'Criar'}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={() => document.getElementById('finance-form')?.requestSubmit()}
      >
        <FinanceForm
          formId="finance-form"
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
        />
      </CrudSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir lançamento?"
        description={deleting?.description}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function KpiSimple({ label, value, icon: Icon, tone = 'default' }) {
  const toneClass = {
    success: 'text-success bg-success/10',
    danger: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    default: 'text-primary bg-secondary',
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
