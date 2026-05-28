import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';
import { toast } from '@/components/ui/toast';
import { Can } from '@/routes/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { formatCNPJ, formatPhone } from '@/lib/formatters';
import { useUpdateCompany } from '../hooks/useCompany';
import { CompanyForm } from './CompanyForm';

export function CompanyCard() {
  const company = useCurrentCompany();
  const [editing, setEditing] = useState(false);

  const mutation = useUpdateCompany({
    onSuccess: () => {
      toast.success('Empresa atualizada');
      setEditing(false);
    },
    onError: (err) => {
      const code = err?.code ?? err?.cause?.code;
      if (code === '23505') {
        toast.error('Este CNPJ já está em uso por outra empresa.');
        return;
      }
      if (code === '42501') {
        toast.error('Você não tem permissão para editar esta empresa.');
        return;
      }
      toast.error(err?.message ?? 'Erro ao atualizar empresa');
    },
  });

  if (!company) return null;

  const defaults = {
    name: company.name ?? '',
    document: company.document ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Dados da empresa</CardTitle>
          <CardDescription>Informações exibidas em notas e contratos.</CardDescription>
        </div>
        {!editing && (
          <Can permission={PERMISSIONS.SETTINGS_UPDATE}>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Can>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <CompanyForm
            defaultValues={defaults}
            loading={mutation.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(payload) => mutation.mutate({ id: company.id, payload })}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Razão social">
              <Input defaultValue={company.name ?? ''} readOnly />
            </FormField>
            <FormField label="CNPJ">
              <Input
                defaultValue={company.document ? formatCNPJ(company.document) : ''}
                readOnly
              />
            </FormField>
            <FormField label="E-mail">
              <Input defaultValue={company.email ?? ''} readOnly />
            </FormField>
            <FormField label="Telefone">
              <Input
                defaultValue={company.phone ? formatPhone(company.phone) : ''}
                readOnly
              />
            </FormField>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
