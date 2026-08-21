import { useMemo, useState } from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export function ProductPicker({ products, selectedIds, onSelect, disabled }) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => products.filter((product) => !selectedIds.includes(product.product_id)),
    [products, selectedIds],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between sm:w-[320px]"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar produto
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(420px,calc(100vw-3rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome ou SKU…" />
          <CommandList>
            <CommandEmpty>Nenhum produto disponível.</CommandEmpty>
            <CommandGroup>
              {options.map((product) => {
                const outOfStock = product.balance <= 0;
                return (
                  <CommandItem
                    key={product.product_id}
                    value={`${product.product_name} ${product.sku ?? ''}`}
                    onSelect={() => {
                      onSelect(product);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{product.product_name}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {product.sku ?? 'sem SKU'} · {formatCurrency(product.price)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs tabular-nums',
                        outOfStock ? 'font-semibold text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {outOfStock ? 'sem saldo' : `${formatNumber(product.balance)} em estoque`}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
