import { useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { suppliersHooks } from '../hooks/useSuppliers';
import { CustomerForm } from '@/modules/customers/components/CustomerForm';

// Suppliers compartilham o mesmo schema visual de Customers — reaproveitamos o form.

const STATUS_MAP = {
  active:   { label: 'Ativo',     variant: 'success'  },
  inactive: { label: 'Inativo',   variant: 'secondary'},
  blocked:  { label: 'Bloqueado', variant: 'danger'   },
};

export function SuppliersListPage() {
  const [{ page, perPage, search, sort, asc }, setQueryStates] = useQueryStates(
    {
      page:    parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(20),
      search:  parseAsString.withDefault(''),
      sort:    parseAsString.withDefault('created_at'),
      asc:     parseAsInteger.withDefault(0),
    },
    { history: 'replace' },
  );

  const debouncedSearch = useDebounce(search, 300);
  const queryParams = useMemo(
    () => ({ page, perPage, search: debouncedSearch, searchField: 'name', order: { field: sort, asc: asc === 1 } }),
    [page, perPage, debouncedSearch, sort, asc],
  );

  const { data: result, isLoading } = suppliersHooks.useList(queryParams);
  const suppliers = result?.data ?? [];
  const total = result?.count ?? 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const createMutation = suppliersHooks.useCreate({
    onSuccess: () => { toast.success('Fornecedor criado'); setSheetOpen(false); },
    onError: (err) => toast.error(err.message ?? 'Erro ao criar fornecedor'),
  });
  const updateMutation = suppliersHooks.useUpdate({
    onSuccess: () => { toast.success('Fornecedor atualizado'); setSheetOpen(false); setEditing(null); },
    onError: (err) => toast.error(err.message ?? 'Erro ao atualizar'),
  });
  const deleteMutation = suppliersHooks.useDelete({
    onSuccess: () => { toast.success('Fornecedor excluído'); setDeleting(null); },
    onError: (err) => toast.error(err.message ?? 'Erro ao excluir'),
  });

  const handleSort = (field) => {
    if (sort === field) setQueryStates({ asc: asc === 1 ? 0 : 1, page: 1 });
    else setQueryStates({ sort: field, asc: 1, page: 1 });
  };

  const columns = useMemo(
    () => [
      nameWithAvatarColumn({ subAccessor: 'email' }),
      documentColumn({}),
      textColumn({ id: 'phone', header: 'Telefone', accessor: 'phone', muted: true, sortable: false }),
      statusColumn({ map: STATUS_MAP }),
      dateColumn({ id: 'created_at', header: 'Criado em', accessor: 'created_at' }),
      actionsColumn((supplier) => (
        <RowActions>
          <Can permission={PERMISSIONS.SUPPLIERS_UPDATE}>
            <DropdownMenuItem onSelect={() => { setEditing(supplier); setSheetOpen(true); }}>
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
          </Can>
          <Can permission={PERMISSIONS.SUPPLIERS_DELETE}>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDeleting(supplier)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </Can>
        </RowActions>
      )),
    ],
    [],
  );

  const handleSubmit = (payload) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description={`${total} fornecedor${total === 1 ? '' : 'es'} cadastrado${total === 1 ? '' : 's'}`}
        actions={
          <Can permission={PERMISSIONS.SUPPLIERS_CREATE}>
            <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo fornecedor
            </Button>
          </Can>
        }
      />

      <DataTable
        columns={columns}
        data={suppliers}
        total={total}
        loading={isLoading}
        page={page}
        perPage={perPage}
        sort={{ field: sort, asc: asc === 1 }}
        onSortChange={handleSort}
        onPageChange={(p) => setQueryStates({ page: p })}
        onPerPageChange={(pp) => setQueryStates({ perPage: pp, page: 1 })}
        emptyState={{ icon: Building2, title: 'Nenhum fornecedor ainda' }}
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
        onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditing(null); }}
        title={editing ? 'Editar fornecedor' : 'Novo fornecedor'}
        submitLabel={editing ? 'Salvar' : 'Criar fornecedor'}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={() => document.getElementById('supplier-form')?.requestSubmit()}
        size="lg"
      >
        <CustomerForm formId="supplier-form" defaultValues={editing ?? undefined} onSubmit={handleSubmit} />
      </CrudSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.name}?`}
        description="O fornecedor será removido (soft delete)."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
