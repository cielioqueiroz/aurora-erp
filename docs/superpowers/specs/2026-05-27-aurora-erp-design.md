# AURORA ERP — Design Document

**Status:** Approved
**Date:** 2026-05-27
**Owner:** Product/Engineering
**Scope of this session:** Design doc + Etapas 1-3 (foundation → auth/RBAC → design system + dashboard)

---

## 1. Visão Geral

AURORA ERP é um SaaS de gestão multi-tenant para PMEs brasileiras, construído como SPA React + Supabase. A proposta de valor está em três pilares:

- **Arquitetura enterprise**: camadas isoladas, regras de negócio fora da UI, repositórios mediando todo acesso a dados.
- **UX premium**: design system próprio inspirado em Linear/Vercel/Stripe, microinterações fluidas, atalhos de teclado, command palette.
- **Multi-tenant nativo**: isolamento por empresa via RLS desde o dia 1; usuários podem pertencer a múltiplas empresas.

Locale: PT-BR (UI/dados em português, código em inglês), BRL, datas dd/mm/aaaa, CNPJ/CPF validados.

---

## 2. Arquitetura

**Padrão:** Feature-based + Clean Architecture leve + Repository pattern.

```
UI Components (apresentação)
        ↓
Hooks (orquestração: useCustomers, useCreateOrder)
        ↓
Services / Use Cases (regra de negócio)
        ↓
Repositories (acesso a dados: customersRepository.list(filters))
        ↓
Supabase Client (integrations/supabase)
```

**Regras de ouro:**
- Componentes NUNCA importam `@/integrations/supabase` diretamente.
- Hooks consomem serviços/repositórios via TanStack Query.
- Schemas Zod ficam em `validations/`, compartilhados entre form e service.
- Cada módulo é uma fatia vertical auto-contida em `modules/<feature>/`.
- Componentes `components/ui` são primitivos, agnósticos a regra de negócio.

**Camadas de estado:**
- **Server state** → TanStack Query (cache, refetch, invalidation, optimistic updates)
- **Global UI state** → Zustand (auth, current company, theme, sidebar collapsed)
- **Form state** → React Hook Form + Zod
- **URL state** → nuqs (filtros, paginação, ordenação bookmarkáveis)

---

## 3. Stack Complementar

| Necessidade | Escolha | Razão |
|---|---|---|
| Roteamento | React Router v6 (data router) | `createBrowserRouter` com loaders |
| Tabelas | TanStack Table + Shadcn DataTable | Headless, integra com nuqs |
| Datas | date-fns + locale pt-BR | Tree-shakable |
| Moeda | `Intl.NumberFormat('pt-BR', { currency: 'BRL' })` | Nativo, zero dep |
| Documentos BR | Validação custom em `validations/br.ts` | CNPJ/CPF |
| Toasts | Sonner | Mais polido que toast padrão |
| Command palette | `cmdk` (vem com Shadcn) | UX premium (Cmd+K) |
| URL state | nuqs | Filtros bookmarkáveis |
| Error boundary | react-error-boundary | Padrão da indústria |
| Class merging | clsx + tailwind-merge → `cn()` | Padrão Shadcn |
| Ícones | Lucide React | Já no prompt |
| Animação | Framer Motion | Já no prompt |
| Charts | Recharts | Já no prompt |
| Testes | Vitest + RTL + MSW + Cypress | MSW mocka Supabase |
| Mock API | MSW | Para testar repositories isoladamente |

---

## 4. Estrutura de Pastas

```
src/
├── app/                      # bootstrap (App.jsx, providers, query client)
├── routes/                   # router config, rotas protegidas, loaders
├── layouts/                  # AppLayout, AuthLayout, BlankLayout
├── pages/                    # entry-points de rota (delegam a modules/*)
├── modules/
│   ├── auth/                 # login, signup, recover, accept-invite
│   ├── dashboard/
│   ├── users/
│   ├── companies/
│   ├── roles/
│   ├── customers/
│   ├── suppliers/
│   ├── products/
│   ├── inventory/
│   ├── orders/
│   ├── finance/
│   ├── reports/
│   └── settings/
│       Estrutura padrão de cada módulo:
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── index.js
│
├── components/
│   ├── ui/                   # Shadcn primitives
│   ├── forms/                # FormField, FormSection, FormActions
│   ├── tables/               # DataTable, ColumnHeader, TableToolbar, Pagination
│   ├── charts/               # ChartCard, KpiCard, SparklineCard
│   ├── feedback/             # EmptyState, ErrorState, LoadingSkeleton
│   ├── navigation/           # Sidebar, Topbar, Breadcrumbs, CommandPalette
│   └── layout/               # PageHeader, PageContainer, Section
│
├── repositories/             # customersRepository, ordersRepository
├── services/                 # cross-module services (ex: auditLogService)
├── hooks/                    # global hooks (useDebounce, useMediaQuery, useShortcut)
├── store/                    # Zustand stores
├── context/                  # apenas providers que não cabem em Zustand
├── lib/                      # cn(), formatters, parsers
├── integrations/
│   └── supabase/             # client.js, types.js (gerado), helpers.js
├── validations/              # zod schemas + validators (cpf, cnpj)
├── constants/                # roles.js, permissions.js, modules.js
├── utils/
├── styles/                   # globals.css, tailwind config tokens
├── assets/
├── tests/                    # setup, helpers, fixtures, msw handlers
└── types/                    # JSDoc typedefs

supabase/
├── migrations/               # versionadas, numeradas
├── seeds/                    # dados iniciais
└── functions/                # edge functions (se necessário)

docs/
├── architecture.md
├── database.md
├── auth-rbac.md
└── superpowers/specs/
```

---

## 5. Modelagem do Banco

### Núcleo multi-tenant
- `companies` — `id, name, document (CNPJ), settings jsonb, created_at, updated_at`
- `profiles` — espelha `auth.users`. `id (=auth.users.id), full_name, avatar_url, default_company_id`
- `user_companies` — `user_id, company_id, role_id, status (active|suspended|invited), invited_by, joined_at`

### RBAC
- `roles` — `id, company_id (null = system role), name, description, is_system_role`
- `permissions` — `id, key (ex: 'customers.create'), module, action, description`
- `role_permissions` — `role_id, permission_id`

### Domínio
- `customers`, `suppliers` — `id, company_id, name, document, email, phone, address jsonb, status, created_by, timestamps`
- `categories` — `id, company_id, name, parent_id` (hierárquico)
- `products` — `id, company_id, sku, name, category_id, price, cost, stock_min, unit, is_active`
- `inventory_movements` — `id, company_id, product_id, type (in|out|adjust), quantity, unit_cost, reason, reference_type, reference_id`
- `orders` — `id, company_id, code, customer_id, status (draft|confirmed|paid|cancelled), subtotal, discount, total, notes`
- `order_items` — `id, order_id, product_id, quantity, unit_price, discount, total`
- `payments` — `id, order_id, method, amount, paid_at, status`
- `finance_transactions` — `id, company_id, type (payable|receivable), category, description, amount, due_date, paid_at, status`
- `notifications` — `id, user_id, company_id, type, title, message, read_at, link`
- `audit_logs` — `id, company_id, user_id, action, entity, entity_id, diff jsonb, ip, created_at`

### Convenções universais
- Toda tabela de domínio tem `company_id uuid not null references companies`
- Toda tabela tem `created_at`, `updated_at` (trigger automático), `deleted_at` (soft delete)
- Toda tabela tem `created_by` apontando para `auth.users`
- Índice composto `(company_id, <campo de busca mais comum>)`

### RLS Pattern
```sql
create function auth.current_company_id() returns uuid ...

create policy "tenant_isolation" on <tabela>
  for all using (company_id = auth.current_company_id());

create policy "requires_permission" on customers
  for insert with check (
    company_id = auth.current_company_id()
    and auth.has_permission('customers.create')
  );
```

---

## 6. Autenticação

- **Provedor:** Supabase Auth (email/senha; futuro: OAuth Google)
- **Fluxos:** login, signup (cria company + role owner), recover password, accept invite
- **Sessão:** client Supabase autogerencia refresh token; listener `onAuthStateChange` atualiza Zustand `authStore`
- **Custom claim de company:** `app_metadata.current_company_id` no JWT. Trocar empresa = atualizar metadata + refresh do JWT.
- **Proteção de rotas:** `<ProtectedRoute requiredPermissions={['customers.read']}>` em `routes/`
- **Logout global:** limpa Zustand + query cache + redirect /login
- **Onboarding:** primeiro signup força criação de empresa (wizard 3 passos: dados → primeiro produto → convidar equipe)

---

## 7. RBAC

### Permissões seed (`<module>.<action>`)
- `dashboard.read`
- `customers.{read,create,update,delete}`
- `suppliers.{read,create,update,delete}`
- `products.{read,create,update,delete}`
- `inventory.{read,move,adjust}`
- `orders.{read,create,update,cancel,refund}`
- `finance.{read,create,update,delete}`
- `reports.{read,export}`
- `users.{read,invite,update,remove}`
- `roles.{read,create,update,delete}`
- `settings.{read,update}`

### Papéis seed
- `owner` — criado no signup, todas as permissões, indestrutível
- `admin` — tudo exceto owner-only
- `manager` — CRUDs operacionais sem settings/roles
- `operator` — cria/lê pedidos e movimenta estoque
- `viewer` — só leitura

### Frontend
- Hook `usePermission('customers.create')` → boolean
- Componente `<Can permission="customers.create">{...}</Can>`
- Sidebar oculta módulos sem `*.read`

### Backend
- Função `auth.has_permission(key text)` consultada nos `with check` das policies de INSERT/UPDATE/DELETE
- SELECT só checa tenant isolation

---

## 8. Estratégia de Testes

- **Unitários (Vitest):** validações Zod, validadores CNPJ/CPF, utils, formatters, services
- **Componentes (RTL):** primitives do design system, FormField, DataTable
- **Integração (Vitest + MSW):** repositórios contra mock do Supabase
- **E2E (Cypress):** login → criar cliente → criar pedido → marcar pago
- **Cobertura mínima:** 70% em services/validations/utils/repositories; 50% global

---

## 9. Design System

### Tema
Dual (light/dark), light como padrão. Toggle persistido em localStorage + sincroniza com SO.

### Paleta (CSS variables HSL via Shadcn)
- Primary: **Aurora Indigo** `hsl(243, 75%, 59%)`
- Accent: **Aurora Violet** `hsl(263, 70%, 65%)`
- Neutros: escala slate (50 → 950)
- Semânticos: success (emerald), warning (amber), danger (rose), info (sky)

### Tipografia
- Sans: **Inter** (variável, 100-900)
- Mono: **JetBrains Mono** (SKUs, IDs, valores monetários)

### Espaçamento e raio
- Base 4px (Tailwind)
- `--radius: 0.625rem` (10px) cards/inputs; `0.375rem` (6px) botões
- Shadows sutis em camadas

### Layout principal
- **Sidebar fixa esquerda** (260px / 72px colapsada): logo + company switcher → módulos → user menu
- **Topbar:** breadcrumbs + Cmd+K → notifications → theme toggle → avatar
- **PageHeader + Section** blocks padrão

### Microinterações
- Route transitions fade + slide-up (150ms)
- Hover em cards: lift sutil
- Sidebar collapse: spring
- Skeleton em loading > 200ms
- Optimistic UI em mutations rápidas

### Componentes-bandeira
- Command Palette (Cmd+K) — navegação + ações + busca global
- KPI Cards com sparkline + delta semanal
- DataTable premium: filtros, ordenação, seleção, ações em lote, export, paginação server-side
- Empty States ilustrados
- Toast actions (undo de delete)

---

## 10. Plano de Implementação (Etapas 1-3)

### Etapa 1 — Fundação
1. Vite + React + estrutura de pastas
2. Tailwind + tokens (CSS vars) + tema
3. Aliases (`@/*`), ESLint, Prettier, Husky, lint-staged
4. Vitest + MSW setup
5. React Router v6, layouts vazios, error boundary global
6. Providers: QueryClient, Theme, Toaster, Tooltip, ErrorBoundary
7. `lib/cn`, formatters BR
8. README + .env.example

### Etapa 2 — Supabase + Auth + RBAC
9. `supabase/migrations/0001_init_multitenancy.sql`
10. `supabase/migrations/0002_rls_helpers.sql`
11. `supabase/migrations/0003_audit_notifications.sql`
12. `supabase/migrations/0004_domain_tables.sql`
13. `supabase/seeds/permissions_and_roles.sql`
14. `integrations/supabase/client.js`
15. `repositories/` base com tenant isolation
16. `store/authStore`, `store/companyStore`
17. Telas: Login, Signup (onboarding wizard), Recover, Accept Invite
18. `routes/ProtectedRoute`, `routes/PermissionGate`
19. Hooks: `useAuth`, `usePermission`, `useCurrentCompany`

### Etapa 3 — Design System + Layouts + Dashboard
20. Shadcn primitives: button, input, label, form, dialog, sheet, dropdown-menu, popover, command, tabs, table, badge, avatar, skeleton, toast (sonner), tooltip, separator, scroll-area
21. Componentes próprios: PageHeader, Section, KpiCard, EmptyState, ErrorState, DataTable, FormField, CommandPalette
22. AppShell: Sidebar (colapsável, company switcher), Topbar (busca, notifications, theme, user menu)
23. Layouts: AppLayout, AuthLayout
24. DashboardPage com 4 KPI cards + 2 charts + atividades recentes (mock)
25. Tema persistente, route transitions, command palette funcional
26. Smoke test E2E: login → dashboard

---

## Decisões aprovadas
- Sem TypeScript (prompt: "JavaScript") — JSDoc para type hints
- Multi-tenant via `app_metadata.current_company_id` no JWT
- Onboarding incluído na Etapa 2
- Aurora Indigo como cor primária
- Apenas planejar migrations SQL (não criar projeto Supabase agora)
