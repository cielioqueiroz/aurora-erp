import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FormField } from '@/components/forms/FormField';
import { profileSchema } from '@/validations/profile';
import { getInitials } from '@/lib/formatters';

export function ProfileForm({ defaultValues, email, loading, onCancel, onSubmit }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const liveName = watch('full_name') ?? defaultValues.full_name;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-base">
            {getInitials(liveName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{liveName}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome" error={errors.full_name?.message} required>
          <Input
            placeholder="Seu nome completo"
            autoFocus
            disabled={loading}
            {...register('full_name')}
          />
        </FormField>
        <FormField label="E-mail" description="A mudança de e-mail será adicionada em breve.">
          <Input value={email ?? ''} readOnly disabled />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !isDirty}>
          {loading ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
