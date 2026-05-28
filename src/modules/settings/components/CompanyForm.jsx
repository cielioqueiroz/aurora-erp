import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';
import { companySchema } from '@/validations/company';
import { formatCNPJ, formatPhone } from '@/lib/formatters';

export function CompanyForm({ defaultValues, loading, onCancel, onSubmit }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  const docValue = watch('document') ?? '';
  const phoneValue = watch('phone') ?? '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Razão social"
          error={errors.name?.message}
          required
          className="sm:col-span-2"
        >
          <Input
            placeholder="Ex: Nexus LTDA"
            autoFocus
            disabled={loading}
            {...register('name')}
          />
        </FormField>

        <FormField label="CNPJ" error={errors.document?.message}>
          <Input
            value={formatCNPJ(docValue)}
            onChange={(e) => setValue('document', e.target.value, { shouldValidate: true, shouldDirty: true })}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            disabled={loading}
          />
        </FormField>

        <FormField label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="contato@empresa.com"
            disabled={loading}
            {...register('email')}
          />
        </FormField>

        <FormField label="Telefone" error={errors.phone?.message}>
          <Input
            value={formatPhone(phoneValue)}
            onChange={(e) => setValue('phone', e.target.value, { shouldValidate: true, shouldDirty: true })}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            disabled={loading}
          />
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
