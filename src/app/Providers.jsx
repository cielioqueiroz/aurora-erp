import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toast';
import { ErrorFallback } from '@/components/feedback/ErrorFallback';
import { useTheme } from '@/hooks/useTheme';
import { queryClient } from './queryClient';
import { AuthBootstrap } from './AuthBootstrap';

function ThemeBoot({ children }) {
  useTheme();
  return children;
}

export function Providers({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeBoot>
          <TooltipProvider delayDuration={150}>
            <AuthBootstrap>{children}</AuthBootstrap>
            <Toaster />
            {import.meta.env.DEV && import.meta.env.VITE_DEVTOOLS === 'true' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </TooltipProvider>
        </ThemeBoot>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
