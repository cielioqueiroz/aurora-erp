import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/forms/FormField';
import { customerSchema } from '@/validations/customer';
import { formatCEP, formatDocument, formatPhone } from '@/lib/formatters';
import { onlyDigits } from '@/lib/parsers';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
];

const emptyDefaults = {
  name: '',
  document: '',
  email: '',
  phone: '',
  address: { street: '', number: '', complement: '', district: '', city: '', state: '', zip: '' },
  notes: '',
  status: 'active',
};

export function CustomerForm({ formId = 'customer-form', defaultValues, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useEffect(() => {
    form.reset({ ...emptyDefaults, ...defaultValues });
  }, [defaultValues, form]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const docValue = watch('document') ?? '';
  const phoneValue = watch('phone') ?? '';
  const cepValue = watch('address.zip') ?? '';
  const status = watch('status');

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          document: values.document ? onlyDigits(values.document) : null,
          phone: values.phone ? onlyDigits(values.phone) : null,
        }),
      )}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome / Razão social"
          error={errors.name?.message}
          required
          className="sm:col-span-2"
        >
          <Input placeholder="Ex: João da Silva" {...register('name')} />
        </FormField>

        <FormField label="CPF / CNPJ" error={errors.document?.message}>
          <Input
            value={formatDocument(docValue)}
            onChange={(e) => setValue('document', e.target.value, { shouldValidate: true })}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <Select value={status} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" placeholder="cliente@exemplo.com" {...register('email')} />
        </FormField>

        <FormField label="Telefone" error={errors.phone?.message}>
          <Input
            value={formatPhone(phoneValue)}
            onChange={(e) => setValue('phone', e.target.value, { shouldValidate: true })}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
        </FormField>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Endereço
        </legend>
        <div className="grid gap-4 sm:grid-cols-6">
          <FormField label="CEP" className="sm:col-span-2">
            <Input
              value={formatCEP(cepValue)}
              onChange={(e) => setValue('address.zip', e.target.value)}
              placeholder="00000-000"
              inputMode="numeric"
            />
          </FormField>
          <FormField label="Logradouro" className="sm:col-span-4">
            <Input {...register('address.street')} placeholder="Rua, av..." />
          </FormField>
          <FormField label="Número" className="sm:col-span-1">
            <Input {...register('address.number')} placeholder="123" />
          </FormField>
          <FormField label="Complemento" className="sm:col-span-3">
            <Input {...register('address.complement')} placeholder="Sala, andar..." />
          </FormField>
          <FormField label="Bairro" className="sm:col-span-2">
            <Input {...register('address.district')} />
          </FormField>
          <FormField label="Cidade" className="sm:col-span-4">
            <Input {...register('address.city')} />
          </FormField>
          <FormField label="UF" className="sm:col-span-2" error={errors.address?.state?.message}>
            <Input maxLength={2} {...register('address.state')} placeholder="SP" />
          </FormField>
        </div>
      </fieldset>

      <FormField label="Observações" error={errors.notes?.message}>
        <Textarea rows={3} {...register('notes')} placeholder="Notas internas (opcional)" />
      </FormField>
    </form>
  );
}
