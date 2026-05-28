import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { authRepository } from '@/repositories/authRepository';
import { signupAccountSchema, signupCompanySchema } from '@/validations/auth';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/components/ui/toast';
import { formatCNPJ, formatPhone } from '@/lib/formatters';
import { onlyDigits } from '@/lib/parsers';
import { cn } from '@/lib/cn';

const STEPS = [
  { key: 'account', label: 'Conta', icon: User },
  { key: 'company', label: 'Empresa', icon: Building2 },
  { key: 'done',    label: 'Pronto',  icon: Check },
];

function Stepper({ current }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const active = idx === current;
        const done = idx < current;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold transition-colors',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary bg-aurora-soft text-primary',
                !active && !done && 'border-border bg-background text-muted-foreground',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-px flex-1 transition-colors',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AccountStep({ onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: { fullName: '', email: '', password: '', confirm: '', acceptTerms: false },
  });

  const onSubmit = async (values) => {
    try {
      await authRepository.signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      toast.success('Conta criada! Agora vamos cadastrar sua empresa.');
      onNext();
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível criar a conta');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Nome completo" error={errors.fullName?.message} required>
        <Input placeholder="Como devemos te chamar?" {...register('fullName')} />
      </FormField>
      <FormField label="E-mail" error={errors.email?.message} required>
        <Input type="email" placeholder="voce@empresa.com.br" {...register('email')} />
      </FormField>
      <FormField label="Senha" error={errors.password?.message} required description="Mínimo 8 caracteres, com maiúscula, minúscula e número.">
        <Input type="password" {...register('password')} />
      </FormField>
      <FormField label="Confirmar senha" error={errors.confirm?.message} required>
        <Input type="password" {...register('confirm')} />
      </FormField>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          {...register('acceptTerms')}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        <span>
          Concordo com os <a className="underline" href="#">Termos</a> e a{' '}
          <a className="underline" href="#">Política de Privacidade</a>.
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <>Continuar <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </form>
  );
}

function CompanyStep({ onBack, onDone }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupCompanySchema),
    defaultValues: { name: '', document: '', phone: '' },
  });

  const docValue = watch('document');
  const phoneValue = watch('phone');

  const onSubmit = async (values) => {
    try {
      await authRepository.createCompany({
        name: values.name,
        document: values.document ? onlyDigits(values.document) : null,
        phone: values.phone ? onlyDigits(values.phone) : null,
      });
      toast.success('Empresa criada com sucesso!');
      onDone();
    } catch (err) {
      toast.error(err.message ?? 'Não foi possível criar a empresa');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Nome da empresa" error={errors.name?.message} required>
        <Input placeholder="Ex: Aurora Comércio Ltda" {...register('name')} />
      </FormField>
      <FormField label="CNPJ" error={errors.document?.message} description="Opcional, mas recomendado para emissão futura de notas.">
        <Input
          value={formatCNPJ(docValue ?? '')}
          onChange={(e) => setValue('document', e.target.value, { shouldValidate: true })}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
        />
      </FormField>
      <FormField label="Telefone" error={errors.phone?.message}>
        <Input
          value={formatPhone(phoneValue ?? '')}
          onChange={(e) => setValue('phone', e.target.value)}
          placeholder="(11) 99999-9999"
          inputMode="tel"
        />
      </FormField>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Criar empresa <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </form>
  );
}

function DoneStep() {
  const navigate = useNavigate();
  return (
    <div className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
        <Check className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Tudo pronto!</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua conta e empresa foram criadas. Vamos ao dashboard.
      </p>
      <Button size="lg" className="mt-6 w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Ir para o dashboard <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SignupPage() {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const hasCompanies = useAuthStore((s) => s.companies.length > 0);
  const [step, setStep] = useState(isAuthenticated && !hasCompanies ? 1 : 0);

  // Se a sessão for resolvida depois da montagem (autenticado sem empresa),
  // pula direto para o passo "empresa" ao invés de pedir login de novo.
  useEffect(() => {
    if (isAuthenticated && !hasCompanies && step === 0) setStep(1);
  }, [isAuthenticated, hasCompanies, step]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Em 2 passos você terá sua empresa no AURORA ERP.
        </p>
      </div>
      <Stepper current={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <AccountStep onNext={() => setStep(1)} />}
          {step === 1 && <CompanyStep onBack={() => setStep(0)} onDone={() => setStep(2)} />}
          {step === 2 && <DoneStep />}
        </motion.div>
      </AnimatePresence>

      {step < 2 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      )}
    </div>
  );
}
