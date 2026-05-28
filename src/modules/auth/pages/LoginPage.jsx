import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { authRepository } from '@/repositories/authRepository';
import { loginSchema } from '@/validations/auth';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/components/ui/toast';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      await authRepository.signIn(values);
      toast.success('Bem-vindo de volta!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível entrar');
    }
  };

  return (
    <div>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse sua conta AURORA ERP para continuar.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="E-mail" error={errors.email?.message} required>
          <Input
            type="email"
            placeholder="voce@empresa.com.br"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Senha" error={errors.password?.message} required>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              {...register('password')}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-end">
          <Link to={ROUTES.RECOVER} className="text-xs font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Entrar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem conta ainda?{' '}
        <Link to={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
