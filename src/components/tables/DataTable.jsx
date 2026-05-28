import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DataTablePagination } from './DataTablePagination';
import { cn } from '@/lib/cn';

/**
 * DataTable — wrapper premium em volta do TanStack Table.
 *
 * @param {object} props
 * @param {Array} props.columns — defs do TanStack Table
 * @param {Array} props.data — linhas
 * @param {number} props.total — total no servidor
 * @param {boolean} [props.loading]
 * @param {number} props.page (1-based)
 * @param {number} props.perPage
 * @param {{ field: string, asc: boolean } | null} props.sort
 * @param {(field: string) => void} props.onSortChange
 * @param {(page: number) => void} props.onPageChange
 * @param {(perPage: number) => void} props.onPerPageChange
 * @param {{ icon, title, description, action } | null} [props.emptyState]
 * @param {React.ReactNode} [props.toolbar]
 */
export function DataTable({
  columns,
  data = [],
  total = 0,
  loading = false,
  page = 1,
  perPage = 20,
  sort = null,
  onSortChange,
  onPageChange,
  onPerPageChange,
  emptyState,
  toolbar,
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  });

  const hasRows = data.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {toolbar && <div className="border-b border-border p-3">{toolbar}</div>}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.columnDef.meta?.sortable;
                const isSorted = sort?.field === header.column.id;
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.columnDef.size }}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(header.column.id)}
                        className="inline-flex items-center gap-1.5 rounded hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted ? (
                          sort.asc ? (
                            <ChevronUp className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                {columns.map((col, j) => (
                  <TableCell key={`sk-${i}-${j}`}>
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : hasRows ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.cellClassName)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState
                  icon={emptyState?.icon}
                  title={emptyState?.title ?? 'Nada encontrado'}
                  description={emptyState?.description ?? 'Ajuste os filtros ou cadastre um novo item.'}
                  action={emptyState?.action}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DataTablePagination
        page={page}
        perPage={perPage}
        total={total}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  );
}
