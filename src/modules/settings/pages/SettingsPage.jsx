import { Building2, Moon, Palette, Sun, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { ProfileCard } from '../components/ProfileCard';
import { CompanyCard } from '../components/CompanyCard';

function ThemeCard({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
        active
          ? 'border-primary bg-secondary text-primary'
          : 'border-border bg-card hover:border-primary/40 hover:bg-secondary',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <PageHeader title="Configurações" description="Perfil, empresa e preferências." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4" /> Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileCard />
        </TabsContent>

        <TabsContent value="company">
          <CompanyCard />
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Tema da interface (sincroniza entre dispositivos por usuário em breve).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                <ThemeCard
                  label="Claro"
                  icon={Sun}
                  active={theme === 'light'}
                  onClick={() => setTheme('light')}
                />
                <ThemeCard
                  label="Escuro"
                  icon={Moon}
                  active={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                />
                <ThemeCard
                  label="Sistema"
                  icon={Palette}
                  active={theme === 'system'}
                  onClick={() => setTheme('system')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
