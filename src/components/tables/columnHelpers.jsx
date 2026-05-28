import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, formatDate, formatDateTime, formatDocument, formatInteger, getInitials } from '@/lib/formatters';
import { cn } from '@/lib/cn';

/** Texto simples + opção de muted */
export const textColumn = ({ id, header, accessor, muted = false, sortable = true, size }) => ({
  id,
  accessorKey: accessor ?? id,
  header,
  size,
  meta: { sortable },
  cell: ({ getValue }) => (
    <span className={cn('truncate', muted && 'text-muted-foreground')}>{getValue() ?? '—'}</span>
  ),
});

/** Nome com avatar de iniciais */
export const nameWithAvatarColumn = ({ id = 'name', header = 'Nome', accessor = 'name', subAccessor }) => ({
  id,
  accessorKey: accessor,
  header,
  meta: { sortable: true },
  cell: ({ row }) => {
    const name = row.original[accessor];
    const sub = subAccessor ? row.original[subAccessor] : null;
    return (
      <div className="flex items-center gap-2.5">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{name ?? '—'}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    );
  },
});

/** CPF/CNPJ formatado */
export const documentColumn = ({ id = 'document', header = 'Documento', accessor = 'document' }) => ({
  id,
  accessorKey: accessor,
  header,
  cell: ({ getValue }) => (
    <span className="font-mono text-xs tabular-nums">
      {getValue() ? formatDocument(getValue()) : '—'}
    </span>
  ),
});

/** Moeda BRL */
export const currencyColumn = ({ id, header, accessor, sortable = true }) => ({
  id,
  accessorKey: accessor ?? id,
  header,
  meta: { sortable, className: 'text-right', cellClassName: 'text-right' },
  cell: ({ getValue }) => (
    <span className="tabular-nums font-medium">{formatCurrency(getValue() ?? 0)}</span>
  ),
});

/** Inteiro */
export const integerColumn = ({ id, header, accessor, sortable = true }) => ({
  id,
  accessorKey: accessor ?? id,
  header,
  meta: { sortable, className: 'text-right', cellClassName: 'text-right' },
  cell: ({ getValue }) => <span className="tabular-nums">{formatInteger(getValue() ?? 0)}</span>,
});

/** Data dd/MM/yyyy */
export const dateColumn = ({ id, header, accessor, withTime = false, sortable = true }) => ({
  id,
  accessorKey: accessor ?? id,
  header,
  meta: { sortable },
  cell: ({ getValue }) => (
    <span className="tabular-nums text-muted-foreground">
      {getValue() ? (withTime ? formatDateTime(getValue()) : formatDate(getValue())) : '—'}
    </span>
  ),
});

/** Badge por status configurável via map */
export const statusColumn = ({ id = 'status', header = 'Status', accessor = 'status', map }) => ({
  id,
  accessorKey: accessor,
  header,
  meta: { sortable: true },
  cell: ({ getValue }) => {
    const value = getValue();
    const cfg = map?.[value] ?? { label: value ?? '—', variant: 'secondary' };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  },
});

/** Coluna de ações (fica à direita, sem header) */
export const actionsColumn = (cellRenderer) => ({
  id: 'actions',
  header: () => <span className="sr-only">Ações</span>,
  size: 48,
  meta: { className: 'w-12', cellClassName: 'w-12 pr-3 text-right' },
  cell: ({ row }) => cellRenderer(row.original),
});
