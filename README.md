# AURORA ERP

> Sistema de gestão multi-tenant enterprise — React + Vite + Supabase.

[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20Supabase-4F46E5)]()
[![License](https://img.shields.io/badge/license-Proprietary-1F2937)]()

AURORA ERP é um SaaS de gestão para PMEs brasileiras, construído com arquitetura enterprise, design system próprio e isolamento multi-empresa nativo via Row Level Security do Supabase.

---

## Stack

**Frontend**

- React 18 + Vite 6
- Tailwind CSS + design tokens (Aurora Indigo)
- Shadcn-style primitives (Radix UI)
- TanStack Query · Zustand · React Hook Form · Zod
- Framer Motion · Recharts · Lucide · cmdk · nuqs

**Backend / Infra**

- Supabase (PostgreSQL · Auth · Storage · Realtime · Edge Functions)
- RLS multi-tenant com função helper `auth.current_company_id()`
- RBAC granular (`<module>.<action>`)

**Qualidade**

- Vitest + Testing Library + MSW
- Cypress (E2E)
- ESLint flat config + Prettier + Husky + lint-staged

---

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- (Opcional) Supabase CLI para desenvolvimento local

---

## Setup rápido

```bash
# 1. Clonar
git clone <seu-repo> aurora-erp
cd aurora-erp

# 2. Instalar
npm install

# 3. Configurar variáveis
cp .env.example .env
# edite .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 4. Rodar
npm run dev
```

> Sem `.env` configurado, o app ainda roda — o aviso fica no console e a UI/UX é totalmente navegável (você só não consegue logar até apontar para um Supabase real).

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o Vite em `http://localhost:5173` |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build local |
| `npm run lint` | ESLint com `--max-warnings 0` |
| `npm run lint:fix` | ESLint com autofix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run test` | Vitest (modo run) |
| `npm run test:watch` | Vitest (modo watch) |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Cobertura |
| `npm run test:e2e` | Cypress headless |
| `npm run test:e2e:open` | Cypress GUI |

---

## Estrutura

```
src/
├── app/                  bootstrap (App, Providers, QueryClient, AuthBootstrap)
├── routes/               router + guards (ProtectedRoute, PublicOnlyRoute, Can)
├── layouts/              AppLayout, AuthLayout
├── modules/              fatias verticais (auth, dashboard, customers, ...)
├── components/
│   ├── ui/               primitives Shadcn-style
│   ├── forms/            FormField
│   ├── tables/           DataTable (em construção)
│   ├── charts/           KpiCard, Sparkline
│   ├── feedback/         EmptyState, ErrorFallback, LoadingScreen
│   ├── navigation/       Sidebar, Topbar, CommandPalette, Breadcrumbs
│   └── layout/           PageHeader, Section
├── repositories/         baseRepository + repos por domínio
├── hooks/                useAuth, usePermission, useCurrentCompany, ...
├── store/                Zustand (authStore, uiStore, themeStore)
├── lib/                  cn(), formatters BR, parsers
├── integrations/supabase/ client + helpers de erro
├── validations/          schemas Zod + validadores CPF/CNPJ
├── constants/            permissions, roles, modules, routes
├── styles/               globals.css + tokens
└── tests/                MSW handlers, setup, utils
supabase/
├── migrations/           0001..0005 (multi-tenant, RBAC, audit, domínio, RPCs)
└── seeds/                permissions + papéis seed
```

---

## Arquitetura em camadas

```
UI Components (apresentação)
        ↓
Hooks (useCustomers, useCreateOrder)
        ↓
Services / Use Cases (regra de negócio)
        ↓
Repositories (customersRepository.list)
        ↓
Supabase Client (integrations/supabase)
```

**Regras invioláveis:**

- Componentes NUNCA importam `@/integrations/supabase` direto.
- Hooks consomem repositories via TanStack Query.
- Schemas Zod ficam em `validations/`, compartilhados entre form e service.
- Cada módulo é uma fatia vertical em `modules/<feature>/`.

---

## Multi-tenancy

- Toda tabela de domínio tem `company_id`.
- A empresa ativa é lida do JWT: `app_metadata.current_company_id`.
- Função Postgres `auth.current_company_id()` resolve a claim (com fallback para 1ª empresa do usuário).
- RLS isola por tenant em todas as policies.
- `RPC create_company_with_owner` cria empresa + vincula owner no signup.
- `RPC switch_active_company` troca a empresa ativa.

---

## RBAC

Permissões granulares no formato `<module>.<action>`:

- `customers.{read,create,update,delete}`
- `orders.{read,create,update,cancel,refund}`
- `inventory.{read,move,adjust}`
- …e por aí vai (ver `src/constants/permissions.js`).

**Papéis seed:** `owner`, `admin`, `manager`, `operator`, `viewer`.

**Frontend:**

```jsx
import { Can } from '@/routes/Can';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';

const canCreate = usePermission(PERMISSIONS.CUSTOMERS_CREATE);

<Can permission={PERMISSIONS.CUSTOMERS_DELETE}>
  <Button variant="destructive">Excluir</Button>
</Can>
```

**Backend:** policies usam `auth.has_permission('customers.create')` no `with check`.

---

## Aplicar o schema Supabase

### Opção A — Cloud (Dashboard SQL Editor)

1. Crie um projeto em https://supabase.com/dashboard
2. Em **SQL Editor**, rode em ordem:
   - `supabase/migrations/0001_init_multitenancy.sql`
   - `supabase/migrations/0002_rbac.sql`
   - `supabase/migrations/0003_audit_notifications.sql`
   - `supabase/migrations/0004_domain_tables.sql`
   - `supabase/migrations/0005_signup_rpc.sql`
   - `supabase/seeds/0001_permissions_and_roles.sql`
3. Copie a `URL` e `anon key` em **Settings → API** e cole em `.env`.

### Opção B — Local (Supabase CLI)

```bash
supabase init
supabase start
supabase db reset   # aplica todas migrations + seeds
```

---

## Roadmap

### ✅ Etapa 1 — Fundação
Vite, Tailwind, design tokens, lint/format/hooks, testes, lib, providers, error boundary.

### ✅ Etapa 2 — Supabase + Auth + RBAC
Migrations multi-tenant + RBAC + audit, client + repositories, stores, hooks, login/signup/recover/reset, ProtectedRoute + Can.

### ✅ Etapa 3 — Design System + Dashboard
Primitives, AppShell (Sidebar + Topbar + CommandPalette), DashboardPage (KPIs + charts + atividades), tema persistido, route transitions.

### 🔜 Próximas etapas
- **Etapa 4** — módulos de domínio: Customers → Products → Orders → Inventory → Finance → Users/Roles
- **Etapa 5** — refinamentos UX (atalhos, undo de delete, optimistic everything)
- **Etapa 6** — testes E2E completos + documentação técnica

---

## Convenções de código

- Componentes em PascalCase (`KpiCard.jsx`); utilitários em camelCase (`formatters.js`).
- Imports usam alias absoluto: `@/components/...`, `@/lib/...`.
- Sem `console.log` em produção (lint avisa).
- Mensagens de erro user-facing em PT-BR.
- Schemas Zod retornam mensagens em PT-BR.

---

## Licença

Proprietary © AURORA ERP. Todos os direitos reservados.
