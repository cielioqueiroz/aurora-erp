import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nada por aqui ainda',
  description,
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-aurora-soft blur-xl" />
        <div className="grid h-14 w-14 place-items-center rounded-full bg-aurora-soft text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
