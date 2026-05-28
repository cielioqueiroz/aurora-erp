# AURORA ERP

Sistema de gestão multi-tenant para PMEs brasileiras. React + Vite + Supabase, com isolamento por empresa via RLS e RBAC granular por módulo.

## Stack

- React 18, Vite 6, Tailwind CSS, Radix UI
- TanStack Query, Zustand, React Hook Form, Zod
- Framer Motion, Recharts, lucide-react, cmdk, nuqs
- Supabase (Postgres, Auth, RLS, RPCs)
- Vitest, Testing Library, MSW, Cypress
- ESLint, Prettier, Husky, lint-staged

## Pré-requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase (cloud ou CLI local)

## Setup

```bash
git clone git@github.com:cielioqueiroz/aurora-erp.git
cd aurora-erp
npm install
cp .env.example .env
npm run dev
```

Edite `.env` com a `VITE_SUPABASE_URL` e a `VITE_SUPABASE_ANON_KEY` do seu projeto Supabase. O app sobe em `http://localhost:5173`.

## Scripts

| Comando            | Ação                         |
| ------------------ | ---------------------------- |
| `npm run dev`      | Vite dev server              |
| `npm run build`    | Build de produção em `dist/` |
| `npm run preview`  | Serve o build localmente     |
| `npm run lint`     | ESLint (`--max-warnings 0`)  |
| `npm run lint:fix` | ESLint autofix               |
| `npm run format`   | Prettier write               |
| `npm run test`     | Vitest                       |
| `npm run test:e2e` | Cypress headless             |

## Estrutura

```
src/
  app/                 Bootstrap, Providers, QueryClient, AuthBootstrap
  routes/              Router, ProtectedRoute, PublicOnlyRoute, Can
  layouts/             AppLayout, AuthLayout
  modules/             Fatias verticais por domínio
    auth/              Login, signup, recover, reset
    dashboard/         KPIs, charts, recent activity
    customers/         CRUD com filtros, busca e validação BR
    suppliers/         CRUD de fornecedores
    products/          Produtos com SKU, preço, custo
    inventory/         Movimentações de estoque
    orders/            Pedidos com itens e pagamentos
    finance/           Contas a pagar/receber
    users/             Gestão de membros da empresa
    roles/             Papéis e permissões
    settings/          Perfil, empresa, tema
    reports/           Análises e gráficos
  components/
    ui/                Primitives Shadcn-style
    forms/             FormField, CrudSheet
    tables/            DataTable, RowActions
    charts/            KpiCard, Sparkline
    navigation/        Sidebar, Topbar, CommandPalette
    layout/            PageHeader, Section
    feedback/          EmptyState, ErrorFallback, LoadingScreen
  repositories/        Camada de acesso a dados (base + por domínio)
  hooks/               useAuth, usePermission, useCurrentCompany, useResource
  store/               Zustand: authStore, uiStore, themeStore
  integrations/        Supabase client + tratamento de erros
  validations/         Schemas Zod + validadores CPF/CNPJ
  constants/           Permissions, roles, modules, routes
  lib/                 cn, formatters, parsers
  styles/              globals.css + design tokens
  tests/               Setup, MSW handlers, helpers
supabase/
  migrations/          0001 multi-tenant, 0002 RBAC, 0003 audit/notificações,
                       0004 domínio, 0005 RPCs de signup, 0006 hardening
  seeds/               Permissions e papéis
```

## Arquitetura

```
Componentes (apresentação)
    -> Hooks (TanStack Query)
    -> Repositories (acesso a dados)
    -> Supabase Client
```

Componentes nunca importam o cliente Supabase diretamente. Toda regra de acesso a dados passa pelos repositórios.

## Multi-tenancy

Todas as tabelas de domínio carregam `company_id`. A empresa ativa é uma claim no JWT (`app_metadata.current_company_id`), lida no Postgres pela função `public.current_company_id()`. As policies de RLS isolam por tenant em SELECT, INSERT, UPDATE e DELETE.

RPCs principais:

- `create_company_with_owner(p_name, p_document, p_email, p_phone)` — cria a empresa, vincula o usuário como owner e atualiza a claim.
- `switch_active_company(p_company_id)` — troca a empresa ativa de um usuário que pertence a mais de uma.

## RBAC

37 permissions no formato `<module>.<action>`, agrupadas em 5 papéis seed:

- `owner` — todas as permissions
- `admin` — gestão completa exceto delete de empresa
- `manager` — gestão operacional (clientes, pedidos, estoque, financeiro)
- `operator` — execução (criar pedidos, mover estoque)
- `viewer` — somente leitura

No frontend:

```jsx
import { Can } from '@/routes/Can';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';

const canDelete = usePermission(PERMISSIONS.CUSTOMERS_DELETE);

<Can permission={PERMISSIONS.CUSTOMERS_DELETE}>
  <Button variant="destructive">Excluir</Button>
</Can>;
```

No backend, policies usam `public.has_permission('customers.create')` no `with check`.

## Design system

Paleta unificada Aurora Premium:

| Token         | Cor                                   | Uso                                         |
| ------------- | ------------------------------------- | ------------------------------------------- |
| `primary`     | Cobalt blue                           | Ações, links, navegação ativa               |
| `accent`      | Champagne                             | Detalhes premium, segunda série de gráficos |
| `success`     | Sage                                  | Confirmações, lucro, status OK              |
| `warning`     | Tobacco amber                         | Alertas                                     |
| `destructive` | Garnet                                | Erros, exclusões                            |
| `info`        | Steel blue                            | Tooltips, dicas neutras                     |
| `background`  | Onyx navy (dark) / Pearl gray (light) | Canvas                                      |
| `sidebar`     | Tom distinto do canvas                | Navegação                                   |

## Aplicar o schema

### Supabase Cloud

1. Crie um projeto em https://supabase.com/dashboard
2. No SQL Editor, execute em ordem:
   - `supabase/migrations/0001_init_multitenancy.sql`
   - `supabase/migrations/0002_rbac.sql`
   - `supabase/migrations/0003_audit_notifications.sql`
   - `supabase/migrations/0004_domain_tables.sql`
   - `supabase/migrations/0005_signup_rpc.sql`
   - `supabase/migrations/0006_security_hardening.sql`
   - `supabase/seeds/0001_permissions_and_roles.sql`
3. Em **Settings > API**, copie `URL` e `anon key` para `.env`
4. Em **Authentication > Providers > Email**, desligue "Confirm email" se quiser pular a confirmação no fluxo de signup

### Supabase CLI (local)

```bash
supabase init
supabase start
supabase db reset
```

## Convenções

- Componentes em PascalCase, utilitários em camelCase
- Imports usam alias absoluto: `@/components/...`
- Sem `console.log` em produção
- Mensagens user-facing em PT-BR
- Schemas Zod retornam mensagens em PT-BR
- Sem comentários no código (código autoexplicativo via nomenclatura)

## Licença

Proprietary. Todos os direitos reservados.
