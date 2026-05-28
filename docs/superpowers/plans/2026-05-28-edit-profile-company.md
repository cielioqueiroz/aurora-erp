# Edit Profile + Edit Company Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o usuário edite o próprio nome (aba Perfil) e os dados da empresa ativa (aba Empresa) na página de Configurações, com reflexo imediato no Topbar/Avatar e em qualquer componente que use `useCurrentCompany()`.

**Architecture:** Cada card de Settings ganha um modo de edição inline (botão "Editar" → form react-hook-form + zod com Salvar/Cancelar). Singletons `profileRepository` e `companyRepository` falam direto com Supabase, hooks `useUpdateProfile`/`useUpdateCompany` (TanStack mutation) atualizam o `authStore` Zustand após sucesso para propagar mudanças sem reload.

**Tech Stack:** React 18 + Vite, react-hook-form + zod, TanStack Query (mutations), Zustand (authStore), Supabase JS (auth.updateUser + tabelas `profiles` / `companies`), Vitest.

**Specs:** [`docs/superpowers/specs/2026-05-28-edit-profile-company-design.md`](../specs/2026-05-28-edit-profile-company-design.md)

---

## Task 1: Schema zod do Perfil + testes

**Files:**

- Create: `src/validations/profile.js`
- Test: `src/validations/profile.test.js`

- [ ] **Step 1: Escrever os testes (TDD)**

Criar `src/validations/profile.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { profileSchema } from './profile';

describe('profileSchema', () => {
  it('aceita nome válido com 2+ caracteres', () => {
    const result = profileSchema.parse({ full_name: 'Cielio' });
    expect(result.full_name).toBe('Cielio');
  });

  it('faz trim do nome', () => {
    const result = profileSchema.parse({ full_name: '   Cielio Queiroz   ' });
    expect(result.full_name).toBe('Cielio Queiroz');
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    expect(() => profileSchema.parse({ full_name: 'A' })).toThrow(
      /Nome deve ter ao menos 2 caracteres/,
    );
  });

  it('rejeita nome com mais de 80 caracteres', () => {
    const longName = 'x'.repeat(81);
    expect(() => profileSchema.parse({ full_name: longName })).toThrow();
  });
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

```bash
npx vitest run src/validations/profile.test.js
```

Expected: FAIL com "Failed to resolve import './profile'" ou similar.

- [ ] **Step 3: Implementar o schema**

Criar `src/validations/profile.js`:

```js
import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres'),
});
```

- [ ] **Step 4: Rodar os testes — devem passar**

```bash
npx vitest run src/validations/profile.test.js
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/validations/profile.js src/validations/profile.test.js
git commit -m "feat(validations): add profileSchema for editing user name"
```

---

## Task 2: Schema zod da Empresa + testes

**Files:**

- Create: `src/validations/company.js`
- Test: `src/validations/company.test.js`

- [ ] **Step 1: Escrever os testes (TDD)**

Criar `src/validations/company.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { companySchema } from './company';

const validCNPJ = '11.222.333/0001-81';

describe('companySchema', () => {
  it('aceita payload mínimo (só name)', () => {
    const result = companySchema.parse({ name: 'Nexus LTDA' });
    expect(result.name).toBe('Nexus LTDA');
    expect(result.document).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });

  it('rejeita name vazio', () => {
    expect(() => companySchema.parse({ name: '' })).toThrow(/Razão social/);
  });

  it('faz trim do name', () => {
    const result = companySchema.parse({ name: '  Nexus LTDA  ' });
    expect(result.name).toBe('Nexus LTDA');
  });

  it('aceita CNPJ válido', () => {
    const result = companySchema.parse({ name: 'Nexus', document: validCNPJ });
    expect(result.document).toBe(validCNPJ);
  });

  it('converte CNPJ vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', document: '' });
    expect(result.document).toBeNull();
  });

  it('rejeita CNPJ inválido', () => {
    expect(() => companySchema.parse({ name: 'Nexus', document: '11.111.111/1111-11' })).toThrow(
      /CNPJ inválido/,
    );
  });

  it('rejeita email malformado', () => {
    expect(() => companySchema.parse({ name: 'Nexus', email: 'nao-eh-email' })).toThrow(
      /E-mail inválido/,
    );
  });

  it('converte email vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', email: '' });
    expect(result.email).toBeNull();
  });

  it('aceita telefone válido', () => {
    const result = companySchema.parse({ name: 'Nexus', phone: '(11) 99999-9999' });
    expect(result.phone).toBe('(11) 99999-9999');
  });

  it('rejeita telefone inválido', () => {
    expect(() => companySchema.parse({ name: 'Nexus', phone: '123' })).toThrow(/Telefone inválido/);
  });

  it('converte telefone vazio em null', () => {
    const result = companySchema.parse({ name: 'Nexus', phone: '' });
    expect(result.phone).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

```bash
npx vitest run src/validations/company.test.js
```

Expected: FAIL ("Failed to resolve import './company'").

- [ ] **Step 3: Implementar o schema**

Criar `src/validations/company.js`:

```js
import { z } from 'zod';
import { isValidCNPJ, isValidPhone } from './br';

const optionalNullable = (validator, message) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || validator(v), message);

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Razão social obrigatória')
    .max(120, 'Razão social deve ter no máximo 120 caracteres'),
  document: optionalNullable(isValidCNPJ, 'CNPJ inválido'),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido'),
  phone: optionalNullable(isValidPhone, 'Telefone inválido'),
});
```

- [ ] **Step 4: Rodar os testes — devem passar**

```bash
npx vitest run src/validations/company.test.js
```

Expected: 11 passed.

- [ ] **Step 5: Rodar suíte completa pra garantir que nada regrediu**

```bash
npm run test
```

Expected: todas as suites passam (incluindo `br.test.js` original).

- [ ] **Step 6: Commit**

```bash
git add src/validations/company.js src/validations/company.test.js
git commit -m "feat(validations): add companySchema for editing company data"
```

---

## Task 3: Profile repository

**Files:**

- Create: `src/repositories/profileRepository.js`

Este repositório encapsula as três chamadas Supabase necessárias para atualizar o nome do usuário: `auth.updateUser` (metadata), `profiles.update` (tabela espelho) e `auth.refreshSession` (para o JWT/sessão refletir o novo nome).

- [ ] **Step 1: Implementar o repository**

Criar `src/repositories/profileRepository.js`:

```js
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
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/profileRepository.js
git commit -m "feat(repositories): add profileRepository.update"
```

---

## Task 4: useUpdateProfile hook

**Files:**

- Create: `src/modules/settings/hooks/useProfile.js`

- [ ] **Step 1: Implementar o hook**

Criar `src/modules/settings/hooks/useProfile.js`:

```js
import { useMutation } from '@tanstack/react-query';
import { profileRepository } from '@/repositories/profileRepository';
import { useAuthStore } from '@/store/authStore';

export function useUpdateProfile(options = {}) {
  return useMutation({
    mutationFn: (payload) => profileRepository.update(payload),
    onSuccess: (session, vars, ctx) => {
      if (session) useAuthStore.getState().setSession(session);
      options.onSuccess?.(session, vars, ctx);
    },
    onError: options.onError,
  });
}
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/modules/settings/hooks/useProfile.js
git commit -m "feat(settings): add useUpdateProfile hook"
```

---

## Task 5: ProfileForm component (form puro)

**Files:**

- Create: `src/modules/settings/components/ProfileForm.jsx`

- [ ] **Step 1: Implementar o componente**

Criar `src/modules/settings/components/ProfileForm.jsx`:

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FormField } from '@/components/forms/FormField';
import { profileSchema } from '@/validations/profile';
import { getInitials } from '@/lib/formatters';

export function ProfileForm({ defaultValues, email, loading, onCancel, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-base">
            {getInitials(defaultValues.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{defaultValues.full_name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome" error={errors.full_name?.message} required>
          <Input
            placeholder="Seu nome completo"
            autoFocus
            disabled={loading}
            {...register('full_name')}
          />
        </FormField>
        <FormField label="E-mail" description="A mudança de e-mail será adicionada em breve.">
          <Input value={email ?? ''} readOnly disabled />
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
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/modules/settings/components/ProfileForm.jsx
git commit -m "feat(settings): add ProfileForm with RHF + zod"
```

---

## Task 6: ProfileCard component + wire no SettingsPage

**Files:**

- Create: `src/modules/settings/components/ProfileCard.jsx`
- Modify: `src/modules/settings/pages/SettingsPage.jsx`

- [ ] **Step 1: Implementar o ProfileCard**

Criar `src/modules/settings/components/ProfileCard.jsx`:

```jsx
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FormField } from '@/components/forms/FormField';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/formatters';
import { useUpdateProfile } from '../hooks/useProfile';
import { ProfileForm } from './ProfileForm';

export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);

  const mutation = useUpdateProfile({
    onSuccess: () => {
      toast.success('Perfil atualizado');
      setEditing(false);
    },
    onError: (err) => toast.error(err?.message ?? 'Erro ao atualizar perfil'),
  });

  const fullName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>Como você aparece para o time.</CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {editing ? (
          <ProfileForm
            defaultValues={{ full_name: fullName }}
            email={user?.email}
            loading={mutation.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(payload) => mutation.mutate(payload)}
          />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-base">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome">
                <Input defaultValue={fullName} readOnly />
              </FormField>
              <FormField label="E-mail">
                <Input defaultValue={user?.email ?? ''} readOnly />
              </FormField>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Atualizar SettingsPage para usar ProfileCard**

Em `src/modules/settings/pages/SettingsPage.jsx`, substituir o bloco inteiro da aba Perfil. O arquivo atual tem (linhas 56-86):

```jsx
<TabsContent value="profile">
  <Card>
    <CardHeader>
      <CardTitle>Seu perfil</CardTitle>
      <CardDescription>Como você aparece para o time.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-base">{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{fullName}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome">
          <Input defaultValue={fullName} readOnly />
        </FormField>
        <FormField label="E-mail">
          <Input defaultValue={user?.email ?? ''} readOnly />
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">Edição de perfil chega na próxima iteração.</p>
    </CardContent>
  </Card>
</TabsContent>
```

Substituir por:

```jsx
<TabsContent value="profile">
  <ProfileCard />
</TabsContent>
```

E adicionar o import no topo do arquivo:

```jsx
import { ProfileCard } from '../components/ProfileCard';
```

Remover os imports que ficarem sem uso após a refatoração:

- Remover `Avatar`, `AvatarFallback` se não usados em outro lugar do arquivo
- Manter `Input`, `FormField`, `Card*` (ainda usados pelos outros tabs)
- Manter `useAuthStore`, `getInitials` se ainda referenciados no `fullName` para a aba Empresa (verificar; provavelmente não — ver Task 10)
- Remover `User` do lucide-react se não usado (ainda é, no TabsTrigger)

Verifique o arquivo após edição: deve compilar sem warnings.

- [ ] **Step 3: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 4: Verificação manual**

```bash
npm run dev
```

Abrir http://localhost:5173/settings:

1. Aba Perfil mostra dados read-only com botão "Editar" no header do card
2. Clicar "Editar" → form aparece, botão "Editar" some
3. Mudar nome para algo válido, clicar "Salvar alterações"
4. Toast verde "Perfil atualizado", card volta pra modo leitura
5. Topbar (canto superior direito — onde aparece o nome/avatar do usuário) reflete o novo nome **sem F5**
6. F5 na página: nome continua atualizado
7. Editar de novo, mudar nome, clicar Cancelar → nada persiste
8. Editar, deixar nome com 1 caractere → erro inline "Nome deve ter ao menos 2 caracteres"
9. Editar mas não mudar nada → botão "Salvar alterações" fica disabled

Se algum passo falhar, parar e debugar antes de commitar.

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/components/ProfileCard.jsx src/modules/settings/pages/SettingsPage.jsx
git commit -m "feat(settings): wire ProfileCard with inline edit mode for user name"
```

---

## Task 7: Company repository

**Files:**

- Create: `src/repositories/companyRepository.js`

- [ ] **Step 1: Implementar o repository**

Criar `src/repositories/companyRepository.js`:

```js
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

    const res = await supabase.from('companies').update(normalized).eq('id', id).select().single();

    if (res.error) throw toAppError(res.error);
    return res.data;
  },
};
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/companyRepository.js
git commit -m "feat(repositories): add companyRepository.update with digit normalization"
```

---

## Task 8: useUpdateCompany hook

**Files:**

- Create: `src/modules/settings/hooks/useCompany.js`

- [ ] **Step 1: Implementar o hook**

Criar `src/modules/settings/hooks/useCompany.js`:

```js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authRepository } from '@/repositories/authRepository';
import { companyRepository } from '@/repositories/companyRepository';
import { useAuthStore } from '@/store/authStore';

export function useUpdateCompany(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => companyRepository.update(id, payload),
    onSuccess: async (data, vars, ctx) => {
      const companies = await authRepository.listMyCompanies();
      useAuthStore.getState().setCompanies(companies ?? []);
      qc.invalidateQueries({ queryKey: ['companies'] });
      options.onSuccess?.(data, vars, ctx);
    },
    onError: options.onError,
  });
}
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/modules/settings/hooks/useCompany.js
git commit -m "feat(settings): add useUpdateCompany hook with store sync"
```

---

## Task 9: CompanyForm component (form puro)

**Files:**

- Create: `src/modules/settings/components/CompanyForm.jsx`

- [ ] **Step 1: Implementar o componente**

Criar `src/modules/settings/components/CompanyForm.jsx`:

```jsx
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
          <Input placeholder="Ex: Nexus LTDA" autoFocus disabled={loading} {...register('name')} />
        </FormField>

        <FormField label="CNPJ" error={errors.document?.message}>
          <Input
            value={formatCNPJ(docValue)}
            onChange={(e) =>
              setValue('document', e.target.value, { shouldValidate: true, shouldDirty: true })
            }
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
            onChange={(e) =>
              setValue('phone', e.target.value, { shouldValidate: true, shouldDirty: true })
            }
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
```

- [ ] **Step 2: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Commit**

```bash
git add src/modules/settings/components/CompanyForm.jsx
git commit -m "feat(settings): add CompanyForm with masked inputs and zod validation"
```

---

## Task 10: CompanyCard component + wire no SettingsPage

**Files:**

- Create: `src/modules/settings/components/CompanyCard.jsx`
- Modify: `src/modules/settings/pages/SettingsPage.jsx`

- [ ] **Step 1: Implementar o CompanyCard**

Criar `src/modules/settings/components/CompanyCard.jsx`:

```jsx
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
              <Input defaultValue={company.document ? formatCNPJ(company.document) : ''} readOnly />
            </FormField>
            <FormField label="E-mail">
              <Input defaultValue={company.email ?? ''} readOnly />
            </FormField>
            <FormField label="Telefone">
              <Input defaultValue={company.phone ? formatPhone(company.phone) : ''} readOnly />
            </FormField>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Atualizar SettingsPage para usar CompanyCard**

Em `src/modules/settings/pages/SettingsPage.jsx`, substituir o bloco da aba Empresa (linhas 88-117 originais, agora já deslocadas após Task 6):

```jsx
<TabsContent value="company">
  <Card>
    <CardHeader>
      <CardTitle>Dados da empresa</CardTitle>
      <CardDescription>Informações exibidas em notas e contratos.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Razão social">
          <Input defaultValue={company?.name ?? ''} readOnly />
        </FormField>
        <FormField label="CNPJ">
          <Input defaultValue={company?.document ? formatCNPJ(company.document) : ''} readOnly />
        </FormField>
        <FormField label="E-mail">
          <Input defaultValue={company?.email ?? ''} readOnly />
        </FormField>
        <FormField label="Telefone">
          <Input defaultValue={company?.phone ? formatPhone(company.phone) : ''} readOnly />
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">
        Edição de dados da empresa chega na próxima iteração.
      </p>
    </CardContent>
  </Card>
</TabsContent>
```

Substituir por:

```jsx
<TabsContent value="company">
  <CompanyCard />
</TabsContent>
```

E adicionar o import:

```jsx
import { CompanyCard } from '../components/CompanyCard';
```

Após a refatoração, **remover imports que ficaram sem uso** em `SettingsPage.jsx`:

- `useCurrentCompany` (CompanyCard usa direto agora)
- `formatCNPJ`, `formatPhone` (movidos pro CompanyCard)
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` ainda são usados? **Sim** — aba Aparência ainda usa. Manter.
- `Input` ainda é usado? **Não na aba Perfil/Empresa após Task 6+10** — verificar se aba Aparência usa. **Não usa.** Remover.
- `FormField` — idem. Remover se não usado na aba Aparência.

Verifique o arquivo final visualmente — ele deve ficar enxuto (só orquestra os tabs, sem lógica de display dos cards).

- [ ] **Step 3: Rodar lint**

```bash
npm run lint
```

Expected: zero warnings. Se aparecer `'X' is defined but never used`, remover o import.

- [ ] **Step 4: Verificação manual da aba Empresa**

```bash
npm run dev
```

Abrir http://localhost:5173/settings → aba Empresa:

1. Card mostra dados read-only da Nexus LTDA com botão "Editar" no header (Cielio é owner, tem `settings.update`)
2. Clicar "Editar" → form aparece com 4 campos editáveis
3. Mudar a razão social para "Nexus LTDA — Teste", clicar Salvar
4. Toast verde "Empresa atualizada", card volta pra leitura
5. Topbar (onde exibe o nome da empresa) reflete a mudança **sem F5**
6. Reverter pra "Nexus LTDA" e salvar novamente (limpeza)
7. Editar, digitar CNPJ inválido (ex: `11.111.111/1111-11`) → erro inline "CNPJ inválido"
8. Editar, deixar Razão social vazia → erro inline "Razão social obrigatória"
9. Editar, deixar email vazio e telefone vazio → permite salvar
10. Editar, digitar e-mail malformado → erro inline
11. Cancelar funciona; Salvar disabled enquanto !isDirty

Se algum passo falhar, parar e debugar.

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/components/CompanyCard.jsx src/modules/settings/pages/SettingsPage.jsx
git commit -m "feat(settings): wire CompanyCard with permission-gated inline edit"
```

---

## Task 11: Verificação final + format

**Files:** nenhum novo. Limpeza geral.

- [ ] **Step 1: Format**

```bash
npm run format
```

Expected: alguns arquivos podem ser reformatados pelo Prettier.

- [ ] **Step 2: Lint final**

```bash
npm run lint
```

Expected: zero warnings.

- [ ] **Step 3: Suíte de testes completa**

```bash
npm run test
```

Expected: todas as suites passam. Conferir que as duas suites novas (`profile.test.js` e `company.test.js`) aparecem na lista.

- [ ] **Step 4: Smoke test do app inteiro**

```bash
npm run dev
```

Conferir, em http://localhost:5173:

- Login funciona (`nexus@nexus.com.br`)
- Dashboard carrega com KPIs e charts (sem regressão na Topbar — nome de usuário e empresa corretos)
- Topbar: command palette (Ctrl+K) ainda abre
- Topbar: sino de notificações continua mostrando contador
- Sidebar: navegação funciona em todos os 13 módulos
- Settings aba Aparência: alternar tema (light/dark/system) ainda funciona
- Exportar relatório do Dashboard (PDF) ainda funciona

Qualquer regressão = parar e debugar.

- [ ] **Step 5: Commit final (se format mudou arquivos)**

```bash
git add -A
git status
git commit -m "chore(format): apply prettier after settings feature work" || echo "nada pra commitar"
```

- [ ] **Step 6: Pronto — handoff para Cielio**

A árvore deve estar limpa após este passo. **Não fazer `git push`** — Cielio faz o push manualmente.

Mensagem final ao usuário:

> Implementação concluída. X commits criados em `main`. Funcionalidades 2 e 3 do RESUME.md fechadas: edição de Perfil e edição de Empresa, ambas com sincronização imediata no Topbar/Avatar/`useCurrentCompany()`. Quando você der `git push`, o RESUME.md pode mover os itens 2 e 3 da seção ALTA pra "O QUE JÁ ESTÁ PRONTO".
