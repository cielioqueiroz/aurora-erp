import { supabase } from '@/integrations/supabase/client';
import { toAppError, unwrap } from '@/integrations/supabase/errors';

export const authRepository = {
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAppError(error);
    return data;
  },

  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw toAppError(error);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw toAppError(error);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw toAppError(error);
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw toAppError(error);
    return data.user;
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback({ event, session });
    });
    return () => data.subscription.unsubscribe();
  },

  async sendPasswordRecovery(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw toAppError(error);
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw toAppError(error);
    return data;
  },

  async createCompany({ name, document, email, phone }) {
    const res = await supabase.rpc('create_company_with_owner', {
      p_name: name,
      p_document: document,
      p_email: email,
      p_phone: phone,
    });
    const company = unwrap(res);

    await supabase.auth.refreshSession();
    return company;
  },

  async switchCompany(companyId) {
    const res = await supabase.rpc('switch_active_company', { p_company_id: companyId });
    if (res.error) throw toAppError(res.error);

    await supabase.auth.refreshSession();
  },

  async listMyCompanies() {
    const res = await supabase.from('my_companies').select('*');
    return unwrap(res);
  },

  async listMyPermissions() {
    const res = await supabase.from('my_permissions').select('key');
    return (unwrap(res) ?? []).map((r) => r.key);
  },
};
