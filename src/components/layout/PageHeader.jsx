import { cn } from '@/lib/cn';

export function PageHeader({ title, description, actions, className, children }) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
