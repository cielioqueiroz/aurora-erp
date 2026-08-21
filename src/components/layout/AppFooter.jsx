import { ArrowUpRight } from 'lucide-react';
import {
  APP_NAME,
  APP_VERSION,
  AUTHOR_NAME,
  AUTHOR_PORTFOLIO_URL,
  COMPANY_LEGAL_NAME,
} from '@/constants/app';

function Dot() {
  return (
    <span aria-hidden="true" className="text-border">
      &middot;
    </span>
  );
}

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="container mx-auto flex flex-wrap items-center gap-x-2.5 gap-y-2 px-6 py-4 text-xs text-muted-foreground">
        <span>
          &copy; {year} {COMPANY_LEGAL_NAME}
        </span>
        <Dot />
        <span>Todos os direitos reservados</span>
        <Dot />
        <span className="inline-flex items-center gap-1.5">
          Desenvolvido por
          <a
            href={AUTHOR_PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {AUTHOR_NAME}
            <ArrowUpRight className="h-3 w-3 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px" />
          </a>
        </span>
        <span className="ml-auto font-mono text-[0.6875rem] tracking-tight">
          {APP_NAME} v{APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
