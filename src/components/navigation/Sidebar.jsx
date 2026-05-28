import { NavLink, Link } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  LogOut,
  Settings,
  Building2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          'text-muted-foreground hover:bg-accent hover:text-foreground',
          isActive && 'bg-aurora-soft text-primary hover:bg-aurora-soft hover:text-primary',
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
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
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
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent',
        collapsed && 'justify-center px-1.5',
      )}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-aurora text-xs font-semibold text-primary-foreground">
        {getInitials(company?.name ?? 'AE')}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {company?.name ?? 'AURORA ERP'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {company?.role_name ?? 'Sem empresa ativa'}
          </p>
        </div>
      )}
      {!collapsed && <Building2 className="h-4 w-4 text-muted-foreground" />}
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

  const handleSignOut = async () => {
    try {
      await authRepository.signOut();
      window.location.href = ROUTES.LOGIN;
    } catch (err) {
      toast.error(err.message ?? 'Erro ao sair');
    }
  };

  const trigger = (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent',
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sair
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
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-aurora text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="text-base font-semibold tracking-tight"
              >
                AURORA
              </motion.span>
            )}
          </AnimatePresence>
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
