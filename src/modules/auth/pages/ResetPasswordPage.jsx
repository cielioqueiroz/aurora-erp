import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { authRepository } from '@/repositories/authRepository';
import { resetSchema } from '@/validations/auth';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/components/ui/toast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async ({ password }) => {
    try {
      await authRepository.updatePassword(password);
      toast.success('Senha atualizada com sucesso');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível atualizar a senha');
    }
  };

  return (
    <div>
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha forte. Você usará ela para entrar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          label="Nova senha"
          error={errors.password?.message}
          required
          description="Mínimo 8 caracteres, com maiúscula, minúscula e número."
        >
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField label="Confirmar senha" error={errors.confirm?.message} required>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar senha'}
        </Button>
      </form>
    </div>
  );
}
