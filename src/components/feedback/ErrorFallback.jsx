import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ?? 'Ocorreu um erro inesperado.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={resetErrorBoundary} variant="default">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
