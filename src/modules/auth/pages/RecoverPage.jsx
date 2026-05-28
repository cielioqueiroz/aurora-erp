import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { authRepository } from '@/repositories/authRepository';
import { recoverSchema } from '@/validations/auth';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/components/ui/toast';

export function RecoverPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    try {
      await authRepository.sendPasswordRecovery(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível enviar o link');
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Verifique seu e-mail</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link para redefinir sua senha. Ele expira em 1 hora.
        </p>
        <Button variant="outline" asChild className="mt-6">
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-2">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-aurora-soft text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-center text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="E-mail" error={errors.email?.message} required>
          <Input type="email" placeholder="voce@empresa.com.br" {...register('email')} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
        </Button>
      </form>

      <Link
        to={ROUTES.LOGIN}
        className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao login
      </Link>
    </div>
  );
}
