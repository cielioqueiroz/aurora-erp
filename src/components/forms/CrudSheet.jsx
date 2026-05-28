import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export function CrudSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onSubmit,
  loading = false,
  disabled = false,
  size = 'default',
  children,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col p-0',
          size === 'default' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl',
          size === 'xl' && 'sm:max-w-4xl',
        )}
      >
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onSubmit} disabled={loading || disabled}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
