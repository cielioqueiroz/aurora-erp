import { supabase } from '@/integrations/supabase/client';
import { toAppError } from '@/integrations/supabase/errors';

export const profileRepository = {
  async update({ full_name }) {
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: { full_name },
    });
    if (updateError) throw toAppError(updateError);

    const userId = updateData.user?.id;
    if (!userId) throw toAppError(new Error('Sessão inválida'));

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', userId);
    if (profileError) throw toAppError(profileError);

    const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError) throw toAppError(sessionError);

    return sessionData.session;
  },
};
