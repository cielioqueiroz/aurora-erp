# Edit Profile + Edit Company — Design

**Data:** 2026-05-28
**Pendências cobertas:** itens 2 e 3 de `RESUME.md` (ALTA prioridade)
**Status:** brainstorming concluído, aguardando review do usuário antes de gerar plano de implementação.

---

## Objetivo

Permitir que o usuário edite:

1. O próprio nome (`profiles.full_name` + `auth.users.user_metadata.full_name`) na aba **Perfil** de Configurações.
2. Os dados da empresa ativa (`companies.name`, `document`, `email`, `phone`) na aba **Empresa** de Configurações.

Ao salvar, o resto do app (Topbar, Avatar, `useCurrentCompany()`) deve refletir imediatamente sem reload.

## Fora do escopo (entregas futuras)

- Upload de avatar — depende de Supabase Storage. Agrupar com item 8 (upload de imagens de produtos).
- Mudança de e-mail do usuário (login) — depende de SMTP. Item 15.
- Refinar RLS de `companies` para exigir `has_permission('settings.update')` no UPDATE — gate de front cobre o uso normal; refinar quando houver papéis sem `settings.update`.
- Convite real de membros — item 9.

## Decisões de design

| Tópico                           | Decisão                                                                                    | Por quê                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Avatar                           | Fora do escopo                                                                             | Sem Storage configurado; entregar junto com upload de produtos                    |
| UX                               | Edição inline com modo edit (botão "Editar" → campos editáveis com Salvar/Cancelar)        | Settings não é CRUD de lista; Sheet é overkill pra 4 campos; padrão GitHub/Linear |
| Email do user                    | Read-only com tooltip                                                                      | Mudança exige confirmação por e-mail (SMTP não configurado)                       |
| Permission gate (empresa)        | `<Can permission={SETTINGS_UPDATE}>` no botão Editar                                       | Front gate suficiente; RLS permite update por qualquer membro ativo               |
| Permission gate (perfil)         | Nenhum                                                                                     | RLS já restringe a `id = auth.uid()`                                              |
| Sincronização pós-save (perfil)  | `setSession()` no `authStore` com sessão refreshada                                        | Topbar lê de `user.user_metadata.full_name`                                       |
| Sincronização pós-save (empresa) | Refetch de `my_companies` + `setCompanies()`                                               | View pode evoluir; refetch evita acoplamento ao shape                             |
| Repositórios                     | Novos `profileRepository` e `companyRepository` (não usam `createResourceHooks`)           | São singletons, não listas                                                        |
| Validações                       | Schemas zod novos `profile.js` e `company.js`, reusando `isValidDocument` / `isValidPhone` | Padrão do projeto                                                                 |

## Arquitetura

```
Settings UI
  ├── ProfileCard (aba Perfil)
  │     ├── view mode (read-only + botão "Editar")
  │     └── edit mode → ProfileForm (RHF + zod)
  │            └── useUpdateProfile() ─► profileRepository.update()
  │                                       ├── supabase.auth.updateUser({ data })
  │                                       ├── supabase.from('profiles').update()
  │                                       └── supabase.auth.refreshSession()
  │            ─► setSession() no authStore
  │
  ├── CompanyCard (aba Empresa, gate SETTINGS_UPDATE)
  │     ├── view mode + botão "Editar"
  │     └── edit mode → CompanyForm (RHF + zod)
  │            └── useUpdateCompany() ─► companyRepository.update()
  │                                       └── supabase.from('companies').update()
  │            ─► authRepository.listMyCompanies() ─► setCompanies()
  │
  └── AppearanceCard (inalterado)
```

## Componentes novos

| Arquivo                                           | Responsabilidade                                |
| ------------------------------------------------- | ----------------------------------------------- |
| `src/modules/settings/components/ProfileCard.jsx` | Orquestra view↔edit, conecta mutation           |
| `src/modules/settings/components/ProfileForm.jsx` | Form puro (RHF + zod), recebe defaults+onSubmit |
| `src/modules/settings/components/CompanyCard.jsx` | Idem, com gate de permissão                     |
| `src/modules/settings/components/CompanyForm.jsx` | Form puro com 4 campos + máscaras               |
| `src/repositories/profileRepository.js`           | `getMine()`, `update(payload)`                  |
| `src/repositories/companyRepository.js`           | `getById(id)`, `update(id, payload)`            |
| `src/modules/settings/hooks/useProfile.js`        | `useUpdateProfile()` (TanStack mutation)        |
| `src/modules/settings/hooks/useCompany.js`        | `useUpdateCompany()`                            |
| `src/validations/profile.js`                      | Schema zod do perfil                            |
| `src/validations/company.js`                      | Schema zod da empresa                           |
| `src/validations/profile.test.js`                 | Testes do schema                                |
| `src/validations/company.test.js`                 | Testes do schema                                |

## Arquivos modificados

| Arquivo                                       | Mudança                                                     |
| --------------------------------------------- | ----------------------------------------------------------- |
| `src/modules/settings/pages/SettingsPage.jsx` | Substituir blocos das abas Perfil/Empresa pelos novos cards |

> `FormField` já suporta `description` para texto auxiliar abaixo do input — usar essa prop para o aviso "A mudança de e-mail será adicionada em breve" no campo de e-mail read-only.

## Data flow detalhado

### Profile update

1. User clica "Salvar" em `ProfileEditMode`.
2. `ProfileForm.onSubmit({ full_name })` → `useUpdateProfile.mutate(payload)`.
3. `profileRepository.update(payload)`:
   - `await supabase.auth.updateUser({ data: { full_name } })`
   - `await supabase.from('profiles').update({ full_name }).eq('id', user.id)`
   - `await supabase.auth.refreshSession()`
   - retorna sessão atualizada
4. `onSuccess`:
   - `useAuthStore.getState().setSession(newSession)`
   - `toast.success('Perfil atualizado')`
   - `setEditing(false)`
5. `onError`: `toast.error(toAppError(err).message)`, permanece em edit.

### Company update

1. User clica "Salvar" em `CompanyEditMode`.
2. `CompanyForm.onSubmit(values)` → `useUpdateCompany.mutate({ id, payload })`.
3. `companyRepository.update(id, payload)`:
   - normaliza: `document` → `onlyDigits`, `phone` → `onlyDigits`
   - `await supabase.from('companies').update(payload).eq('id', id).select().single()`
   - retorna linha atualizada
4. `onSuccess`:
   - `const companies = await authRepository.listMyCompanies()`
   - `useAuthStore.getState().setCompanies(companies)`
   - `queryClient.invalidateQueries({ queryKey: ['companies'] })`
   - `toast.success('Empresa atualizada')`
   - `setEditing(false)`
5. `onError`:
   - `err.code === '23505'` → "Este CNPJ já está em uso"
   - `err.code === '42501'` → "Você não tem permissão para editar esta empresa"
   - default → `toast.error(toAppError(err).message)`

## Validações (zod)

```js
// src/validations/profile.js
profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
});

// src/validations/company.js
companySchema = z.object({
  name: z.string().trim().min(2, 'Razão social obrigatória').max(120),
  document: z
    .string()
    .trim()
    .refine((v) => !v || isValidDocument(v), 'CNPJ inválido')
    .transform((v) => v || null),
  email: z
    .string()
    .email('E-mail inválido')
    .or(z.literal(''))
    .transform((v) => v || null),
  phone: z
    .string()
    .refine((v) => !v || isValidPhone(v), 'Telefone inválido')
    .transform((v) => v || null),
});
```

## Testes

**Vitest unit tests (a escrever):**

- `src/validations/profile.test.js` — 4 casos (nome 2+, nome <2, nome >80, trim)
- `src/validations/company.test.js` — 7 casos (mínimo, name vazio, CNPJ válido, CNPJ inválido, email malformado, telefone inválido, vazios → null)

**Sem testes de UI:** projeto não tem Testing Library; verificação manual cobre.

## Verificação manual

1. `npm run lint` — zero warnings
2. `npm run test` — todas as suites passam
3. `npm run dev` → http://localhost:5173/settings:
   - **Perfil**: editar nome, salvar, confirmar reflexo imediato no Topbar/Avatar sem F5; recarregar e validar persistência; cancelar não persiste; Salvar disabled enquanto não dirty; nome com 1 caractere → erro inline
   - **Empresa**: botão Editar visível pra owner; mudar razão social e ver Topbar atualizar sem F5; CNPJ inválido → erro inline; CNPJ duplicado → toast "já está em uso"; email/telefone aceitam vazio
   - **Aparência**: troca de tema continua funcionando

## Critérios de aceitação

1. Posso editar `full_name` do perfil e ver o reflexo imediato no Topbar/Avatar.
2. Posso editar `name`/`document`/`email`/`phone` da empresa ativa e ver reflexo imediato em qualquer componente que use `useCurrentCompany()`.
3. Validações zod cobrem todos os casos da seção Testes.
4. Botão "Editar" da empresa só aparece pra quem tem `settings.update`.
5. Erros de RLS e CNPJ duplicado produzem mensagens amigáveis.
6. `npm run lint` continua zero warnings.
7. `npm run test` continua passando com as suites novas.
8. Nada regrediu: notificações, command palette, theme toggle, exportação de relatórios.

## Convenções respeitadas

- Sem comentários no código
- Sem emojis em arquivos
- PT-BR em mensagens user-facing e schemas
- Imports com alias `@/...`
- Repository pattern (componentes não importam Supabase direto)
- Zustand v5 seletores atômicos
- Cielio é quem dá `git push`
