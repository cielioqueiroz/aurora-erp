# Modo demonstração — aplicação sem login

Estado atual: **a autenticação está desligada** para apresentação a clientes. Qualquer pessoa com a URL entra direto no dashboard.

Isto não é uma configuração de produção. Antes de expor o sistema a qualquer rede que não seja a sua máquina, reverta.

## O que foi desligado

1. **`src/routes/router.jsx`** — as rotas de autenticação (`/login`, `/signup`, `/recover`, `/reset-password`) redirecionam para o dashboard, e as rotas internas não passam mais por `ProtectedRoute`.
2. **`.env`** — `VITE_DEMO_MODE=true` faz o `AuthBootstrap` injetar uma sessão falsa de owner com todas as permissões e servir dados de `src/app/demoFixtures.js`.
3. **Sidebar** — o item "Sair" foi removido do menu do usuário, porque sem login ele não teria para onde levar.

Nada foi apagado. `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`, `AuthLayout` e as quatro páginas em `src/modules/auth/` continuam intactos.

## Como religar a autenticação

O bypass está commitado, então `git checkout` do arquivo não resolve mais. São dois pontos, os dois manuais:

1. **`src/routes/router.jsx`** — a versão com auth está em `824adc0`:

   ```
   git show 824adc0:src/routes/router.jsx
   ```

   Reponha `PublicOnlyRoute`/`AuthLayout` nas rotas públicas e `ProtectedRoute` no bloco do `AppLayout`, mantendo a rota `/orders/new`, que só existe na versão atual.

2. **`src/components/navigation/Sidebar.jsx`** — o item "Sair" saiu junto com o refresh visual, em `a37f628`. A versão anterior:

   ```
   git show a37f628^:src/components/navigation/Sidebar.jsx
   ```

   Reponha o `LogOut` no dropdown do usuário. Enquanto isso, `authRepository.signOut()` continua alcançável pelo Command Palette (Ctrl+K) — o app não fica sem saída.

Depois, no `.env`: troque `VITE_DEMO_MODE` para `false` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Reinicie o Vite — ele só lê o `.env` no boot.

## Consequências enquanto está desligado

- **Todos os gates de RBAC estão abertos.** O usuário demo tem as 37 permissions, então a interface não representa o que um `operator` ou um `viewer` realmente enxergaria.
- **Os dados são fixtures em memória.** Nada é gravado; recarregar a página descarta qualquer alteração.
- **A empresa é `Aurora Demo Ltda`**, não a Nexus LTDA do Supabase.
