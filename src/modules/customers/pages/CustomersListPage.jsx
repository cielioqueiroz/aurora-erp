import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/tables/DataTable';
import { DataTableToolbar } from '@/components/tables/DataTableToolbar';
import { RowActions } from '@/components/tables/RowActions';
import {
  nameWithAvatarColumn,
  documentColumn,
  textColumn,
  statusColumn,
  dateColumn,
  actionsColumn,
} from '@/components/tables/columnHelpers';
import { CrudSheet } from '@/components/forms/CrudSheet';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { customersHooks } from '../hooks/useCustomers';
import { CustomerForm } from '../components/CustomerForm';

const STATUS_MAP = {
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'secondary' },
  blocked: { label: 'Bloqueado', variant: 'danger' },
};

export function CustomersListPage() {
  const [{ page, perPage, search, sort, asc }, setQueryStates] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(20),
      search: parseAsString.withDefault(''),
      sort: parseAsString.withDefault('created_at'),
      asc: parseAsInteger.withDefault(0),
    },
    { history: 'replace' },
  );

  const debouncedSearch = useDebounce(search, 300);
  const queryParams = useMemo(
    () => ({
      page,
      perPage,
      search: debouncedSearch,
      searchField: 'name',
      order: { field: sort, asc: asc === 1 },
    }),
    [page, perPage, debouncedSearch, sort, asc],
  );

  const { data: result, isLoading } = customersHooks.useList(queryParams);
  const customers = result?.data ?? [];
  const total = result?.count ?? 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const createMutation = customersHooks.useCreate({
    onSuccess: () => {
      toast.success('Cliente criado');
      setSheetOpen(false);
    },
    onError: (err) => toast.error(err.message ?? 'Erro ao criar cliente'),
  });

  const updateMutation = customersHooks.useUpdate({
    onSuccess: () => {
      toast.success('Cliente atualizado');
      setSheetOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(err.message ?? 'Erro ao atualizar'),
  });

  const deleteMutation = customersHooks.useDelete({
    onSuccess: () => {
      toast.success('Cliente excluído');
      setDeleting(null);
    },
    onError: (err) => toast.error(err.message ?? 'Erro ao excluir'),
  });

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (customer) => {
    setEditing(customer);
    setSheetOpen(true);
  };

  const handleSubmit = (payload) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const handleSort = (field) => {
    if (sort === field) setQueryStates({ asc: asc === 1 ? 0 : 1, page: 1 });
    else setQueryStates({ sort: field, asc: 1, page: 1 });
  };

  const columns = useMemo(
    () => [
      nameWithAvatarColumn({ subAccessor: 'email' }),
      documentColumn({}),
      textColumn({
        id: 'phone',
        header: 'Telefone',
        accessor: 'phone',
        muted: true,
        sortable: false,
      }),
      statusColumn({ map: STATUS_MAP }),
      dateColumn({ id: 'created_at', header: 'Criado em', accessor: 'created_at' }),
      actionsColumn((customer) => (
        <RowActions>
          <Can permission={PERMISSIONS.CUSTOMERS_UPDATE}>
            <DropdownMenuItem onSelect={() => openEdit(customer)}>
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
          </Can>
          <Can permission={PERMISSIONS.CUSTOMERS_DELETE}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleting(customer)}
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
        title="Clientes"
        description={`${total} cliente${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'}`}
        actions={
          <Can permission={PERMISSIONS.CUSTOMERS_CREATE}>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          </Can>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        total={total}
        loading={isLoading}
        page={page}
        perPage={perPage}
        sort={{ field: sort, asc: asc === 1 }}
        onSortChange={handleSort}
        onPageChange={(p) => setQueryStates({ page: p })}
        onPerPageChange={(pp) => setQueryStates({ perPage: pp, page: 1 })}
        emptyState={{
          icon: Users,
          title: 'Nenhum cliente ainda',
          description: 'Cadastre seu primeiro cliente para começar a registrar pedidos.',
        }}
        toolbar={
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => setQueryStates({ search: v, page: 1 })}
            placeholder="Buscar por nome…"
          />
        }
      />

      <CrudSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        description={editing ? `Editando ${editing.name}` : 'Cadastre um novo cliente.'}
        submitLabel={editing ? 'Salvar alterações' : 'Criar cliente'}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={() => document.getElementById('customer-form')?.requestSubmit()}
        size="lg"
      >
        <CustomerForm
          formId="customer-form"
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
        />
      </CrudSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.name}?`}
        description="O cliente será removido (soft delete). Pedidos associados permanecem no histórico."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
