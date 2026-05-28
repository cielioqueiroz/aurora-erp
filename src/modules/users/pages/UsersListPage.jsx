import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrudSheet } from '@/components/forms/CrudSheet';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { SYSTEM_ROLE_LABELS } from '@/constants/roles';
import { toast } from '@/components/ui/toast';
import { formatRelative, getInitials } from '@/lib/formatters';
import { useTeamMembers, useTeamRoles, useInviteMember, useRemoveMember } from '../hooks/useTeam';

const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role_id: z.string().min(1, 'Selecione um papel'),
});

const STATUS_MAP = {
  active: { label: 'Ativo', variant: 'success' },
  invited: { label: 'Convidado', variant: 'info' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  removed: { label: 'Removido', variant: 'secondary' },
};

function InviteForm({ formId, roles, onSubmit }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role_id: roles?.find((r) => r.name === 'operator')?.id ?? '' },
  });
  const roleId = watch('role_id');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="E-mail" error={errors.email?.message} required>
        <Input type="email" placeholder="pessoa@empresa.com" {...register('email')} />
      </FormField>
      <FormField label="Papel" error={errors.role_id?.message} required>
        <Select value={roleId} onValueChange={(v) => setValue('role_id', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {(roles ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {SYSTEM_ROLE_LABELS[r.name] ?? r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </form>
  );
}

function MemberRow({ member, onRemove }) {
  const cfg = STATUS_MAP[member.status] ?? STATUS_MAP.active;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(member.full_name ?? member.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{member.full_name ?? member.email}</p>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <p className="font-medium text-foreground">
            {SYSTEM_ROLE_LABELS[member.role_name] ?? member.role_name}
          </p>
          <p>Entrou {formatRelative(member.joined_at)}</p>
        </div>
        <Can permission={PERMISSIONS.USERS_REMOVE}>
          {member.role_name !== 'owner' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(member)}
              aria-label="Remover"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </Can>
      </CardContent>
    </Card>
  );
}

export function UsersListPage() {
  const { data: result, isLoading } = useTeamMembers({});
  const { data: roles } = useTeamRoles();
  const members = result?.data ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState(null);

  const inviteMutation = useInviteMember();
  const removeMutation = useRemoveMember();

  const handleInvite = (payload) => {
    inviteMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Convite enviado');
        setInviteOpen(false);
      },
      onError: (err) => toast.error(err.message ?? 'Erro'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={`${members.length} membro${members.length === 1 ? '' : 's'} na empresa`}
        actions={
          <Can permission={PERMISSIONS.USERS_INVITE}>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Convidar
            </Button>
          </Can>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-[72px] animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sem membros"
          description="Convide pessoas para colaborar nesta empresa."
        />
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} onRemove={setRemoving} />
          ))}
        </div>
      )}

      <CrudSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Convidar membro"
        description="O convite será enviado por e-mail (em produção)."
        submitLabel={
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Enviar convite
          </span>
        }
        loading={inviteMutation.isPending}
        onSubmit={() => document.getElementById('invite-form')?.requestSubmit()}
      >
        <InviteForm formId="invite-form" roles={roles} onSubmit={handleInvite} />
      </CrudSheet>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remover ${removing?.full_name ?? removing?.email}?`}
        description="O membro perderá acesso a esta empresa. Sua conta de usuário não é deletada."
        confirmLabel="Remover"
        loading={removeMutation.isPending}
        onConfirm={() =>
          removeMutation.mutate(removing.id, {
            onSuccess: () => {
              toast.success('Membro removido');
              setRemoving(null);
            },
            onError: (err) => toast.error(err.message ?? 'Erro'),
          })
        }
      />
    </div>
  );
}
