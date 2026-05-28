import { Link, useLocation, useMatches } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { NAV_MODULES } from '@/constants/modules';
import { ROUTES } from '@/constants/routes';

function findModuleByPath(pathname) {
  for (const group of NAV_MODULES) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) return item;
    }
  }
  return null;
}

export function Breadcrumbs() {
  const location = useLocation();
  const matches = useMatches();
  const handle = matches[matches.length - 1]?.handle;

  const moduleItem = findModuleByPath(location.pathname);
  const crumbs = [];
  if (moduleItem) {
    crumbs.push({ label: moduleItem.label, href: moduleItem.href });
  }
  if (handle?.breadcrumb && handle.breadcrumb !== moduleItem?.label) {
    crumbs.push({ label: handle.breadcrumb });
  }

  return (
    <nav aria-label="Caminho" className="flex items-center gap-1.5 text-sm">
      <Link
        to={ROUTES.DASHBOARD}
        className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          {c.href ? (
            <Link to={c.href} className="rounded px-1 text-muted-foreground hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
