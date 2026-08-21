import { Lock, Shield, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamRoles } from '@/modules/users/hooks/useTeam';
import { SYSTEM_ROLE_LABELS } from '@/constants/roles';
import { cn } from '@/lib/cn';

export function RolesListPage() {
  const { data: roles, isLoading } = useTeamRoles();

  return (
    <div>
      <PageHeader title="Papéis" description="Papéis seed do sistema e permissões agrupadas." />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(roles ?? []).map((role) => (
            <Card key={role.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'grid h-10 w-10 place-items-center rounded-lg',
                        role.name === 'owner'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-primary',
                      )}
                    >
                      {role.is_system_role ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <Shield className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">
                        {SYSTEM_ROLE_LABELS[role.name] ?? role.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <Badge variant={role.is_system_role ? 'secondary' : 'default'}>
                    {role.is_system_role ? 'Sistema' : 'Custom'}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {role.members ?? 0} membro{role.members === 1 ? '' : 's'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Edição granular de permissões e criação de papéis customizados chegam na próxima iteração.
          A infraestrutura RBAC já está pronta no banco.
        </p>
      </div>
    </div>
  );
}
