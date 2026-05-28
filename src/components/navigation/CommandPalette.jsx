import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { NAV_MODULES } from '@/constants/modules';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { authRepository } from '@/repositories/authRepository';
import { ROUTES } from '@/constants/routes';

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const permissions = useAuthStore((s) => s.permissions);
  const { resolvedTheme, setTheme } = useTheme();

  const handle = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar comandos, módulos ou páginas…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {NAV_MODULES.map((group) => {
          const items = group.items.filter(
            (item) => !item.permission || permissions.includes(item.permission),
          );
          if (items.length === 0) return null;
          return (
            <CommandGroup key={group.group} heading={group.group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.key}
                    onSelect={handle(() => navigate(item.href))}
                    value={`${group.group} ${item.label}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}

        <CommandSeparator />
        <CommandGroup heading="Geral">
          <CommandItem
            onSelect={handle(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span>Alternar tema</span>
            <CommandShortcut>⇧⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={handle(async () => {
              await authRepository.signOut();
              navigate(ROUTES.LOGIN);
            })}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
