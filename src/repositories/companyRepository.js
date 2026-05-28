import { supabase } from '@/integrations/supabase/client';
import { toAppError } from '@/integrations/supabase/errors';
import { onlyDigits } from '@/lib/parsers';

export const companyRepository = {
  async update(id, payload) {
    const normalized = {
      ...payload,
      document: payload.document ? onlyDigits(payload.document) : null,
      phone: payload.phone ? onlyDigits(payload.phone) : null,
    };

    const res = await supabase
      .from('companies')
      .update(normalized)
      .eq('id', id)
      .select()
      .single();

    if (res.error) throw toAppError(res.error);
    return res.data;
  },
};
