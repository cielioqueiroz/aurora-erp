import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Moon,
  Search,
  Sun,
  Command as CommandIcon,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { useUiStore } from '@/store/uiStore';
import { useShortcut } from '@/hooks/useShortcut';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';
import { Breadcrumbs } from './Breadcrumbs';

const TYPE_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const TYPE_COLOR = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

function formatWhen(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

export function Topbar() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const { data: notifications = [] } = useNotifications({ limit: 10 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  useShortcut('mod+k', () => setCommandOpen(true));

  const handleOpen = (n) => {
    if (!n.read_at) markAsRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex md:w-72 lg:w-80"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate text-left">Pesquisar ou pular para…</span>
        <kbd className="ml-auto inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          <CommandIcon className="h-3 w-3" />K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96 p-0">
          <DropdownMenuLabel className="flex items-center justify-between px-3 py-3">
            <span className="text-sm font-semibold">Notificações</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {unreadCount} novas
              </Badge>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead.mutate()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" /> marcar todas
                </button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />
          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="grid place-items-center px-3 py-12 text-center text-xs text-muted-foreground">
                <Bell className="mb-2 h-6 w-6 opacity-40" />
                Nenhuma notificação por aqui.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? 'text-muted-foreground';
                return (
                  <DropdownMenuItem
                    key={n.id}
                    onSelect={() => handleOpen(n)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 px-3 py-2.5',
                      !n.read_at && 'bg-primary/[0.04]',
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.message && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      )}
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {formatWhen(n.created_at)}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Alternar tema"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}</TooltipContent>
      </Tooltip>
    </header>
  );
}
