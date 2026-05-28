import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

export function KpiCard({ label, value, delta, deltaLabel, icon: Icon, sparkline, loading }) {
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-card-hover">
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-aurora-soft text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            )}
            {delta != null && !loading && (
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                    positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {(Math.abs(delta) * 100).toFixed(1).replace('.', ',')}%
                </span>
                {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
              </div>
            )}
          </div>
          {sparkline && <div className="h-10 w-24 shrink-0">{sparkline}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
