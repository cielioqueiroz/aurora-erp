import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

export function PlaceholderPage({ title, description, hint }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Em construção"
        description={
          hint ??
          'Este módulo será habilitado nas próximas etapas. A arquitetura já está pronta para recebê-lo.'
        }
      />
    </div>
  );
}
