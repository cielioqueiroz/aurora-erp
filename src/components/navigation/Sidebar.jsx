import { NavLink, Link } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, Settings, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { NAV_MODULES } from '@/constants/modules';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { usePermission } from '@/hooks/usePermission';
import { useCurrentCompany, useCompanies } from '@/hooks/useCurrentCompany';
import { authRepository } from '@/repositories/authRepository';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuroraLogo, AuroraMark } from '@/components/brand/AuroraLogo';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/formatters';
import { toast } from '@/components/ui/toast';

function ModuleLink({ item, collapsed }) {
  const allowed = usePermission(item.permission);
  if (!allowed) return null;
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'interactive group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          'text-muted-foreground hover:text-foreground',
          isActive && 'nav-active hover:bg-primary/10 hover:text-primary',
          collapsed && 'justify-center px-2',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
            )}
          />

          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

function CompanySwitcher({ collapsed }) {
  const company = useCurrentCompany();
  const companies = useCompanies();

  const handleSwitch = async (companyId) => {
    try {
      await authRepository.switchCompany(companyId);
      toast.success('Empresa alterada');
      window.location.reload();
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível trocar de empresa');
    }
  };

  const trigger = (
    <button
      type="button"
      className={cn(
        'interactive flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left',
        collapsed && 'justify-center px-1.5',
      )}
    >
      {collapsed ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-card text-[0.6875rem] font-semibold text-muted-foreground">
          {getInitials(company?.name ?? 'AE')}
        </span>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {company?.name ?? 'Nenhuma empresa'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {company?.role_name ?? 'Sem empresa ativa'}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        <DropdownMenuLabel>Empresas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma empresa vinculada</div>
        ) : (
          companies.map((c) => (
            <DropdownMenuItem key={c.id} onSelect={() => handleSwitch(c.id)}>
              <div className="flex w-full items-center gap-2">
                <span className="flex-1 truncate">{c.name}</span>
                {c.id === company?.id && <Check className="h-4 w-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.SETTINGS}>
            <Settings className="h-4 w-4" /> Gerenciar empresas
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ collapsed }) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário';
  const email = user?.email ?? '';

  const trigger = (
    <button
      type="button"
      className={cn(
        'interactive flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
        collapsed && 'justify-center px-1',
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.SETTINGS}>
            <Settings className="h-4 w-4" /> Configurações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="surface-sidebar relative flex h-screen flex-col border-r"
    >
      {}
      <div
        className={cn(
          'flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Aurora — ir para o dashboard"
        >
          {collapsed ? <AuroraMark /> : <AuroraLogo />}
        </Link>
      </div>

      {}
      <div className="border-b border-[hsl(var(--sidebar-border))] p-2">
        <CompanySwitcher collapsed={collapsed} />
      </div>

      {}
      <ScrollArea className="flex-1">
        <nav className="space-y-4 p-2">
          {NAV_MODULES.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <ModuleLink key={item.key} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-2">
        <UserMenu collapsed={collapsed} />
      </div>

      {}
      <Button
        size="icon-sm"
        variant="outline"
        onClick={toggle}
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full shadow-md"
        aria-label={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
      </Button>
    </motion.aside>
  );
}
