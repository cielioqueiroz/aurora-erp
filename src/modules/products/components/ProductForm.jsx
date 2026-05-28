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
import { productSchema } from '@/validations/product';

const emptyDefaults = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  category_id: '',
  unit: 'un',
  price: 0,
  cost: 0,
  stock_min: 0,
  is_active: true,
  images: [],
};

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz', 'pç'];

export function ProductForm({ formId = 'product-form', defaultValues, categories = [], onSubmit }) {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useEffect(() => {
    form.reset({ ...emptyDefaults, ...defaultValues });
  }, [defaultValues, form]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const unit = watch('unit') ?? 'un';
  const categoryId = watch('category_id') ?? '';
  const isActive = watch('is_active');

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          category_id: values.category_id || null,
          sku: values.sku || null,
          barcode: values.barcode || null,
        }),
      )}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <FormField label="Nome" error={errors.name?.message} required className="sm:col-span-4">
          <Input placeholder="Ex: Café Especial 250g" {...register('name')} />
        </FormField>
        <FormField label="SKU" error={errors.sku?.message} className="sm:col-span-2">
          <Input placeholder="CAF-001" {...register('sku')} />
        </FormField>

        <FormField label="Categoria" className="sm:col-span-3">
          <Select value={categoryId || ''} onValueChange={(v) => setValue('category_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Unidade" className="sm:col-span-1">
          <Select value={unit} onValueChange={(v) => setValue('unit', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Status" className="sm:col-span-2">
          <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setValue('is_active', v === 'true')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ativo</SelectItem>
              <SelectItem value="false">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Preço de venda (R$)" error={errors.price?.message} required className="sm:col-span-2">
          <Input type="number" step="0.01" min="0" {...register('price')} />
        </FormField>
        <FormField label="Custo (R$)" error={errors.cost?.message} className="sm:col-span-2">
          <Input type="number" step="0.01" min="0" {...register('cost')} />
        </FormField>
        <FormField label="Estoque mínimo" error={errors.stock_min?.message} className="sm:col-span-2">
          <Input type="number" step="0.001" min="0" {...register('stock_min')} />
        </FormField>

        <FormField label="Código de barras" error={errors.barcode?.message} className="sm:col-span-3">
          <Input placeholder="789..." {...register('barcode')} />
        </FormField>
      </div>

      <FormField label="Descrição" error={errors.description?.message}>
        <Textarea rows={3} {...register('description')} placeholder="Detalhes do produto (opcional)" />
      </FormField>
    </form>
  );
}
