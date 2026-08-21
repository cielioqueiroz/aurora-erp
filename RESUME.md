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
- ESLint zero warnings, Prettier aplicado, Vitest com 48 testes (5 suites) e ensaio das migrations em Postgres real (`sh supabase/tests/run.sh`)

## CONVENÇÕES IMPORTANTES (NÃO REVERTER)

- **Sem comentários no código** — código deve ser autoexplicativo via nomenclatura
- **Sem emojis** em arquivos/código a menos que peça explicitamente
- **PT-BR** em mensagens user-facing e schemas Zod
- **Imports com alias** `@/...`
- **Repository pattern**: componentes nunca importam Supabase direto; tudo via `src/repositories/`
- **Hooks via TanStack Query** (`createResourceHooks`)
- **Zustand v5**: usar seletores atômicos, nunca retornar objeto literal
- **Tailwind tokens HSL** em `src/styles/globals.css` — `:root` = light, `.dark` = dark
- **Demo mode** está **ligado** (`VITE_DEMO_MODE=true`) e a autenticação está desligada para apresentação a cliente — ver `docs/DEMO-SEM-LOGIN.md`. Religar é manual
- **Eu (Cielio) faço o git push** — Claude não deve dar `git push` sozinho

## PENDÊNCIAS PRIORIZADAS

### Account lifecycle — bloqueia abrir cadastro pra terceiros

Hoje o app funciona pra teste interno, mas o ciclo de vida da conta não está pronto pra produção pública (LGPD + UX básica).

1. **SMTP no Supabase** — sem SMTP, o link de "Recuperar senha" nunca chega e qualquer fluxo que envie e-mail (confirmação de signup, troca de e-mail, convite de membro) está quebrado fim-a-fim. UI já chama Supabase certinho; falta só o transporte.
2. **Ligar "Confirm email" no Supabase Auth** — depois do SMTP. Hoje signup entra direto sem confirmar.
3. **Trocar senha estando logado** — UI não existe na aba Perfil de Settings. Implementar usando `supabase.auth.updateUser({ password })` (já existe `authRepository.updatePassword`).
4. **Trocar e-mail do user** — depende de SMTP (Supabase manda confirmação pro novo e-mail). UI também não existe.
5. **Re-enviar e-mail de confirmação** — botão na tela de login pra quem ainda não confirmou (quando #2 estiver ativo).
6. **Excluir conta (LGPD)** — não existe rota, RPC ou Edge Function. Implementar: Edge Function `delete-account` com Service Role chamando `auth.admin.deleteUser(uid)` + RPC que faz soft-delete em `user_companies`/`profiles` antes. Botão "Excluir conta" em Settings → Perfil com confirmação dupla.
7. **Encerrar sessões em outros dispositivos** — `supabase.auth.signOut({ scope: 'others' })` (Supabase JS v2.43+).

### MVP funcional (ALTA prioridade)

8. ~~**"Novo pedido" wizard**~~ — **implementado e validado**. Tela em `/orders/new`, RPCs transacionais em `supabase/migrations/0007_orders_rpc.sql`, máquina de estados no `OrderDetailSheet`. Design em `docs/superpowers/specs/2026-08-19-new-order-design.md` e ADRs 0001-0003.
   As RPCs foram exercitadas contra Postgres 15 real com as migrations e o seed aplicados do zero (`sh supabase/tests/run.sh`): 47 validações rodando como `authenticated` com claims de JWT. O ensaio achou dois defeitos, corrigidos dentro da própria 0007 — pagamento de pedido de valor zero estourava constraint crua, e a view `product_stock_balance` não expunha `is_active`, o que fazia o ProductPicker oferecer produto inativo em produção.
   **Pendente:** aplicar a migration 0007 no Supabase — segue sem ter sido executada lá.
9. **Página de Auditoria** consumindo `audit_logs` (criar `src/modules/audit/` com listagem + filtros por usuário/tabela/ação).
10. **Top produtos no Reports vindo do `order_items` real** — atualmente `Math.random()` em `src/modules/reports/pages/ReportsPage.jsx:86-96`. Query agregada simples.
11. **Realtime nas notificações** via Supabase Realtime (sino atualiza sem reload quando chega notificação nova).

### Melhorias de produto (MÉDIA prioridade)

12. **Editor granular de permissões (Roles)** — `src/modules/roles/pages/RolesListPage.jsx:69` diz "chega na próxima iteração".
13. **Upload de imagens de produtos** — campo `images` existe no schema; falta criar bucket no Supabase Storage + policies + componente de upload. Combinar com #14.
14. **Upload de avatar do user + logo da empresa** — Storage. Agrupar com #13 pra configurar Storage uma única vez.
15. **Convite real de membros** — hoje mockado em `teamRepository.inviteMember` (lança erro se não estiver em demo). Depende de Edge Function + SMTP (#1).
16. **Switch de empresa quando user tem 2+** — chamar `authRepository.switchCompany(id)` a partir de um dropdown no Topbar.
17. **Export em outras páginas** (Pedidos, Financeiro, Inventário) reusando `src/lib/exporters.js`.
18. **Reports: DRE simplificado + fluxo de caixa mensal.**

### Hardening / Segurança / LGPD

19. **Refinar RLS de `companies` pra exigir `has_permission('settings.update')` no UPDATE** — hoje qualquer membro ativo pode editar via DB. Gate de front já cobre o uso normal; refinar pra fechar a defense-in-depth (flagged no spec `docs/superpowers/specs/2026-05-28-edit-profile-company-design.md`).
20. **Páginas reais de Termos de Uso e Política de Privacidade** — signup linka pra `#` hoje (`SignupPage.jsx:119-126`). Obrigatório pra LGPD.
21. **Exportar dados pessoais do usuário** (direito de portabilidade LGPD Art. 18). Edge Function que devolve JSON com tudo do user.
22. **Audit log entries** para signup, login/logout, edição de empresa, exclusão de conta — verificar se as migrations 0003 já cobrem ou se falta trigger.
23. **Sentry (ou similar) pra error monitoring em produção** — hoje erros do front só vão pro console do browser.
24. **Rate limit visível na UX** — Supabase aplica internamente, mas não há mensagem amigável no front quando o user é bloqueado por excesso de tentativas.

### Infra / DX (BAIXA prioridade)

25. **Deploy Vercel** (produção + preview por PR).
26. **CI no GitHub Actions** — rodar `lint + test + build` em todo PR.
27. **Cobertura de testes** — hoje 48 unit tests (validações + motor de pedidos) e 47 validações SQL em `supabase/tests/`. Faltam testes de componentes (RTL já instalado) e e2e (Cypress configurado mas vazio — `cypress/e2e/smoke.cy.js` é o único e é só smoke).
28. **Remover demo mode** (`VITE_DEMO_MODE`, `src/app/demoMode.js`, `src/app/demoFixtures.js`) — já não é necessário rodando com Supabase real.
29. **Seed `0002_nexus_demo.sql` reproduzível** — atualmente o seed da Nexus não está commitado de forma idempotente; recriar o ambiente do zero é manual.
30. **PWA manifest + service worker** se o objetivo for "instalar como app no celular".
31. **Auditoria de acessibilidade** (keyboard nav, contraste WCAG das duas paletas, ARIA nas tabelas).
32. **i18n** — hoje PT-BR hardcoded. Não é urgente, mas se for atender empresas multi-país, levantar antes que vire dívida grande.

## VERIFICAÇÕES DE SANIDADE

- `npm run dev` — Vite em http://localhost:5173
- `npm run lint` — deve passar com zero warnings
- `npm run format` — Prettier write
- Dashboard em http://localhost:5173/dashboard exibe Nexus LTDA com receita YTD R$ 2.4M
- Topbar sino: 7 notificações não lidas (varia)

## PRÓXIMO PASSO SUGERIDO

Comece perguntando qual pendência atacar primeiro. Recomendações:

- **Quer abrir cadastro pra terceiros?** comece pelos itens 1–7 (Account lifecycle). #1 (SMTP) é pré-requisito de #2, #4 e #15.
- **Quer fechar o MVP funcional?** item #8 (Novo pedido wizard) é o maior unlock.
- **Tarefa rápida pra aquecer?** itens #10 (top produtos reais) ou #11 (Realtime).

Antes de qualquer mudança, dê `git status` pra confirmar a árvore está limpa, e leia `README.md` na raiz pra entender a arquitetura completa.
