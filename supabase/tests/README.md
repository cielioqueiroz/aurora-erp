# Ensaio das migrations

As migrations rodam num Postgres real antes de encostarem no Supabase. Este diretório existe porque a suíte do Vitest não cobre SQL: `src/modules/orders/orderEngine.test.js` exercita o motor JS das fixtures de demo, não as RPCs.

```
sh supabase/tests/run.sh
```

Precisa do Docker rodando. Cada execução recria o banco do zero, aplica o shim, todas as migrations em ordem, o seed de permissions/roles e as validações. Nada aqui conversa com projeto Supabase nenhum.

## `00_bootstrap.sql`

Replica o que a plataforma Supabase provê por baixo das migrations e que um Postgres cru não tem:

- os roles `anon`, `authenticated` e `service_role`;
- os _default privileges_ do schema `public` — no Supabase eles são configurados na plataforma, não nas migrations, então precisam existir **antes** para valer nas tabelas que as migrations criam;
- `auth.users` e um `auth.uid()` com a mesma semântica do original: lê o `sub` de `request.jwt.claims`.

Mais um `test_login(user_id, company_id)`, que injeta os claims como o PostgREST faria a cada request.

Não faz parte do schema da aplicação e nunca deve ser aplicado no Supabase.

## `orders_rpc_test.sql`

Exercita as RPCs da migration `0007` como o cliente as chama de verdade: com `set role authenticated` e claims de JWT, não como superusuário. Cobre entrada inválida, numeração sequencial, preço travado no servidor, saldo como pré-condição da confirmação, baixa e compensação de estoque, recebível e pagável, transições ilegais, gate de permissão e isolamento entre empresas.

Duas convenções:

- `expect_error(sql, trecho, rótulo)` falha se a chamada passar, ou se o erro não contiver o trecho esperado — mensagem errada é defeito.
- `expect_eq(atual, esperado, rótulo)` falha na diferença e imprime os dois lados.

Qualquer falha aborta com `ON_ERROR_STOP`, e o `run.sh` propaga o código de saída.
