import { supabase } from '@/integrations/supabase/client';
import { unwrap } from '@/integrations/supabase/errors';

export const notificationsRepository = {
  async list({ limit = 20, onlyUnread = false } = {}) {
    let q = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (onlyUnread) q = q.is('read_at', null);
    const res = await q;
    return unwrap(res) ?? [];
  },

  async countUnread() {
    const res = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);
    if (res.error) throw res.error;
    return res.count ?? 0;
  },

  async markAsRead(id) {
    const res = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    return unwrap(res);
  },

  async markAllAsRead() {
    const res = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    return unwrap(res);
  },
};
