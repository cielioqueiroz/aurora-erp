import { cn } from '@/lib/cn';

export function AuroraMark({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-5 w-5', className)}
    >
      <path d="M5.5 19.25 12 5.25l6.5 14" />
      <path d="M8.75 14.25h6.5" />
      <path d="M2.75 19.25h18.5" />
    </svg>
  );
}

export function AuroraLogo({ className, showWordmark = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <AuroraMark />
      {showWordmark && (
        <span className="text-[0.9375rem] font-semibold tracking-[-0.02em]">Aurora</span>
      )}
    </span>
  );
}
