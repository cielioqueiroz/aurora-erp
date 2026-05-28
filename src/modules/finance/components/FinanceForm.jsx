import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/forms/FormField';
import { financeSchema } from '@/validations/finance';

const empty = {
  type: 'payable',
  category: '',
  description: '',
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  status: 'pending',
};

export function FinanceForm({ formId = 'finance-form', defaultValues, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(financeSchema),
    defaultValues: { ...empty, ...defaultValues },
  });
  useEffect(() => form.reset({ ...empty, ...defaultValues }), [defaultValues, form]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const type = watch('type');
  const status = watch('status');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo" error={errors.type?.message} required>
          <Select value={type} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receivable">A receber</SelectItem>
              <SelectItem value="payable">A pagar</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={status} onValueChange={(v) => setValue('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Descrição" error={errors.description?.message} required>
        <Input {...register('description')} placeholder="Ex: Nota fiscal #1234" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Categoria">
          <Input {...register('category')} placeholder="Vendas, Marketing..." />
        </FormField>
        <FormField label="Vencimento" error={errors.due_date?.message} required>
          <Input type="date" {...register('due_date')} />
        </FormField>
      </div>

      <FormField label="Valor (R$)" error={errors.amount?.message} required>
        <Input type="number" step="0.01" min="0" {...register('amount')} />
      </FormField>
    </form>
  );
}
