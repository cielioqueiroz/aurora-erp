import { Building2, Moon, Palette, Sun, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/forms/FormField';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useTheme } from '@/hooks/useTheme';
import { formatCNPJ, formatPhone } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { ProfileCard } from '../components/ProfileCard';

function ThemeCard({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
        active
          ? 'border-primary bg-aurora-soft text-primary'
          : 'hover:bg-aurora-soft/40 border-border bg-card hover:border-primary/40',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function SettingsPage() {
  const company = useCurrentCompany();
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
          <Card>
            <CardHeader>
              <CardTitle>Dados da empresa</CardTitle>
              <CardDescription>Informações exibidas em notas e contratos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Razão social">
                  <Input defaultValue={company?.name ?? ''} readOnly />
                </FormField>
                <FormField label="CNPJ">
                  <Input
                    defaultValue={company?.document ? formatCNPJ(company.document) : ''}
                    readOnly
                  />
                </FormField>
                <FormField label="E-mail">
                  <Input defaultValue={company?.email ?? ''} readOnly />
                </FormField>
                <FormField label="Telefone">
                  <Input defaultValue={company?.phone ? formatPhone(company.phone) : ''} readOnly />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Edição de dados da empresa chega na próxima iteração.
              </p>
            </CardContent>
          </Card>
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
