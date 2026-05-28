import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * RowActions — botão "..." que abre dropdown com ações por linha.
 *
 * <RowActions>
 *   <DropdownMenuItem onSelect={...}>Editar</DropdownMenuItem>
 *   <DropdownMenuSeparator />
 *   <DropdownMenuItem onSelect={...} className="text-destructive">Excluir</DropdownMenuItem>
 * </RowActions>
 */
export function RowActions({ children, align = 'end' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Ações">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
