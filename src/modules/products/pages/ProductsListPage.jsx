import { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/tables/DataTable';
import { DataTableToolbar } from '@/components/tables/DataTableToolbar';
import { RowActions } from '@/components/tables/RowActions';
import {
  textColumn,
  currencyColumn,
  integerColumn,
  dateColumn,
  actionsColumn,
} from '@/components/tables/columnHelpers';
import { CrudSheet } from '@/components/forms/CrudSheet';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { productsHooks, categoriesHooks } from '../hooks/useProducts';
import { ProductForm } from '../components/ProductForm';

export function ProductsListPage() {
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
  const { data: result, isLoading } = productsHooks.useList({
    page,
    perPage,
    search: debouncedSearch,
    searchField: 'name',
    order: { field: sort, asc: asc === 1 },
  });
  const products = result?.data ?? [];
  const total = result?.count ?? 0;

  const { data: categoriesResult } = categoriesHooks.useList({ perPage: 100 });
  const categories = useMemo(() => categoriesResult?.data ?? [], [categoriesResult?.data]);
  const categoryName = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    return (id) => (id ? map[id] ?? '—' : '—');
  }, [categories]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const createMutation = productsHooks.useCreate({
    onSuccess: () => { toast.success('Produto criado'); setSheetOpen(false); },
    onError: (err) => toast.error(err.message ?? 'Erro ao criar'),
  });
  const updateMutation = productsHooks.useUpdate({
    onSuccess: () => { toast.success('Produto atualizado'); setSheetOpen(false); setEditing(null); },
    onError: (err) => toast.error(err.message ?? 'Erro ao atualizar'),
  });
  const deleteMutation = productsHooks.useDelete({
    onSuccess: () => { toast.success('Produto excluído'); setDeleting(null); },
    onError: (err) => toast.error(err.message ?? 'Erro ao excluir'),
  });

  const handleSort = (field) => {
    if (sort === field) setQueryStates({ asc: asc === 1 ? 0 : 1, page: 1 });
    else setQueryStates({ sort: field, asc: 1, page: 1 });
  };

  const columns = useMemo(
    () => [
      {
        id: 'sku',
        accessorKey: 'sku',
        header: 'SKU',
        meta: { sortable: true },
        cell: ({ getValue }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{getValue() ?? '—'}</span>
        ),
        size: 110,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Produto',
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{categoryName(row.original.category_id)}</p>
          </div>
        ),
      },
      textColumn({ id: 'unit', header: 'Unid.', accessor: 'unit', sortable: false }),
      currencyColumn({ id: 'price', header: 'Preço', accessor: 'price' }),
      currencyColumn({ id: 'cost', header: 'Custo', accessor: 'cost' }),
      integerColumn({ id: 'stock_min', header: 'Estoque mín', accessor: 'stock_min' }),
      {
        id: 'is_active',
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'success' : 'secondary'}>{getValue() ? 'Ativo' : 'Inativo'}</Badge>
        ),
      },
      dateColumn({ id: 'created_at', header: 'Criado', accessor: 'created_at' }),
      actionsColumn((product) => (
        <RowActions>
          <Can permission={PERMISSIONS.PRODUCTS_UPDATE}>
            <DropdownMenuItem onSelect={() => { setEditing(product); setSheetOpen(true); }}>
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
          </Can>
          <Can permission={PERMISSIONS.PRODUCTS_DELETE}>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDeleting(product)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </Can>
        </RowActions>
      )),
    ],
    [categoryName],
  );

  const handleSubmit = (payload) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${total} produto${total === 1 ? '' : 's'} no catálogo`}
        actions={
          <Can permission={PERMISSIONS.PRODUCTS_CREATE}>
            <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </Can>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        total={total}
        loading={isLoading}
        page={page}
        perPage={perPage}
        sort={{ field: sort, asc: asc === 1 }}
        onSortChange={handleSort}
        onPageChange={(p) => setQueryStates({ page: p })}
        onPerPageChange={(pp) => setQueryStates({ perPage: pp, page: 1 })}
        emptyState={{ icon: Package, title: 'Nenhum produto ainda' }}
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
        title={editing ? 'Editar produto' : 'Novo produto'}
        submitLabel={editing ? 'Salvar' : 'Criar produto'}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={() => document.getElementById('product-form')?.requestSubmit()}
        size="lg"
      >
        <ProductForm
          formId="product-form"
          categories={categories}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
        />
      </CrudSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.name}?`}
        description="O produto será removido. Histórico de pedidos permanece intacto."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
