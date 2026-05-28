import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton-shimmer animate-pulse rounded-md bg-muted/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
