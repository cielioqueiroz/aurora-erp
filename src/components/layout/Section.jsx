import { cn } from '@/lib/cn';

export function Section({ title, description, actions, className, children }) {
  return (
    <section className={cn('mb-8', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
