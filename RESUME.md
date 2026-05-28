# Aurora ERP — Prompt de Retomada

Cole o conteúdo abaixo em uma nova conversa do Claude pra continuar exatamente de onde paramos.

---

## CONTEXTO DO PROJETO

Sou Cielio Queiroz (cielioqueiroz@hotmail.com). Estou construindo o **Aurora ERP**, um SaaS multi-tenant para PMEs brasileiras, em parceria com você (Claude) ao longo de várias sessões.

**Stack:** React 18 + Vite 6 + Tailwind + Shadcn primitives + Supabase (Postgres+Auth+RLS) + TanStack Query + Zustand + React Hook Form + Zod + Framer Motion + Recharts.

**Diretório:** `d:\Projetos_Programacao\sistema_gestao`
**Repo:** `git@github.com:cielioqueiroz/aurora-erp.git`
**Supabase project:** `zpvckelruqbrlnfeqhdm` (sa-east-1, projeto "aurora-erp")
**Login de teste:** `nexus@nexus.com.br` / senha que eu defini no signup (Nexus LTDA, owner)

## O QUE JÁ ESTÁ PRONTO

- Auth completo (login/signup 2-step/recover/reset) com JWT claim `current_company_id` + refresh automático
- Multi-tenant + RBAC: 6 migrations, 17 tabelas com RLS, 37 permissions, 5 roles seed
- 13 módulos com pages: dashboard, customers, suppliers, products, inventory, orders, finance, users, roles, settings, reports
- Theme toggle (light = Aurora Serena: #F9F9FB + #2563EB + #D97706 / dark = Minimalismo em Camadas: #18181B + #14B8A6 + #6366F1)
- Dashboard: KPIs, sparklines, charts, **seletor de período 7d/30d/90d/MTD/QTD/YTD**, **export PDF/Excel/Word/CSV** com relatório executivo branded (header colorido, KPI cards, top 10 clientes, saúde financeira, despesas por categoria, footer com page number)
- Notifications: sino ligado ao Supabase com mark-as-read e contador unread
- Sidebar fixa, Topbar com Command Palette (Ctrl+K)
- Settings: edição inline de Perfil (nome) e Empresa (razão social/CNPJ/email/telefone) com sincronização imediata no Topbar/`useCurrentCompany()`, gate `settings.update` na empresa, error mapping pra CNPJ duplicado e RLS
- Nexus LTDA seeded com 368 pedidos, R$ 2.486.252 de receita YTD, dados Jan→Mai 2026
- Sem comentários no código (decisão explícita do usuário — manter assim)
- ESLint zero warnings, Prettier aplicado, Vitest com 35 testes (4 suites)

## CONVENÇÕES IMPORTANTES (NÃO REVERTER)

- **Sem comentários no código** — código deve ser autoexplicativo via nomenclatura
- **Sem emojis** em arquivos/código a menos que peça explicitamente
- **PT-BR** em mensagens user-facing e schemas Zod
- **Imports com alias** `@/...`
- **Repository pattern**: componentes nunca importam Supabase direto; tudo via `src/repositories/`
- **Hooks via TanStack Query** (`createResourceHooks`)
- **Zustand v5**: usar seletores atômicos, nunca retornar objeto literal
- **Tailwind tokens HSL** em `src/styles/globals.css` — `:root` = light, `.dark` = dark
- **Demo mode** existe (`VITE_DEMO_MODE`) mas está `false`; rodando com Supabase real
- **Eu (Cielio) faço o git push** — Claude não deve dar `git push` sozinho

## PENDÊNCIAS PRIORIZADAS

**ALTA prioridade (fechar MVP):**

1. "Novo pedido" wizard — atualmente botão desabilitado em `src/modules/orders/pages/OrdersListPage.jsx:138`
2. Página de Auditoria consumindo `audit_logs` (criar `src/modules/audit/`)
3. Top produtos no Reports vindo do `order_items` real (atualmente `Math.random()` em `src/modules/reports/pages/ReportsPage.jsx:86-96`)
4. Realtime nas notificações via Supabase Realtime
5. Upload de avatar no perfil + foto da empresa (depende de configurar Supabase Storage — agrupar com item 8)
6. Mudança de e-mail do user (depende de SMTP — agrupar com item 15)

**MÉDIA prioridade:** 7. Editor granular de permissões (Roles) — `src/modules/roles/pages/RolesListPage.jsx:69` diz "chega na próxima iteração" 8. Upload de imagens de produtos (Supabase Storage) — campo `images` existe no schema 9. Convite real de membros (atualmente mockado) 10. Switch de empresa quando user tem 2+ 11. Export em outras páginas (Pedidos, Financeiro, Inventário) — usar `src/lib/exporters.js` 12. Reports: DRE simplificado + fluxo de caixa mensal

**BAIXA prioridade / Infra:** 13. Deploy Vercel 14. CI no GitHub Actions 15. SMTP (Auth > Email confirmation está OFF agora) 16. Cobertura de testes 17. Remover demo mode (já não é necessário) 18. Seed `0002_nexus_demo.sql` reproduzível

## VERIFICAÇÕES DE SANIDADE

- `npm run dev` — Vite em http://localhost:5173
- `npm run lint` — deve passar com zero warnings
- `npm run format` — Prettier write
- Dashboard em http://localhost:5173/dashboard exibe Nexus LTDA com receita YTD R$ 2.4M
- Topbar sino: 7 notificações não lidas (varia)

## PRÓXIMO PASSO SUGERIDO

Comece perguntando qual pendência atacar primeiro. Recomendo o item 1 (Novo pedido) porque desbloqueia o fluxo de vendas end-to-end. Alternativa rápida: itens 3 (top produtos reais no Reports) ou 4 (Realtime nas notificações).

Antes de qualquer mudança, dê `git status` pra confirmar a árvore está limpa, e leia `README.md` na raiz pra entender a arquitetura completa.
