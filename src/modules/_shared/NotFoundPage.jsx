import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="text-center">
        <p className="font-mono text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você tentou acessar não existe ou foi movido.
        </p>
        <Button asChild className="mt-6">
          <Link to={ROUTES.DASHBOARD}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
