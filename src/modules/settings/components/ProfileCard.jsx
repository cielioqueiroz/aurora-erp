import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FormField } from '@/components/forms/FormField';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/formatters';
import { useUpdateProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';

export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);

  const mutation = useUpdateProfile({
    onSuccess: () => {
      toast.success('Perfil atualizado');
      setEditing(false);
    },
    onError: (err) => toast.error(err?.message ?? 'Erro ao atualizar perfil'),
  });

  const fullName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>Como você aparece para o time.</CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {editing ? (
          <ProfileForm
            defaultValues={{ full_name: fullName }}
            email={user?.email}
            loading={mutation.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(payload) => mutation.mutate(payload)}
          />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-base">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome">
                <Input defaultValue={fullName} readOnly />
              </FormField>
              <FormField label="E-mail">
                <Input defaultValue={user?.email ?? ''} readOnly />
              </FormField>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
