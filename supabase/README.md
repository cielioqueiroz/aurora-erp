# Supabase — AURORA ERP

Estrutura:

```
supabase/
├── migrations/   # versionadas, aplicar em ordem numérica
└── seeds/        # dados iniciais (rodar após migrations)
```

## Aplicar localmente (Supabase CLI)

```bash
supabase init        # primeira vez
supabase start       # sobe stack local
supabase db reset    # aplica todas migrations + seeds
```

## Aplicar em projeto cloud

1. Crie o projeto em https://supabase.com/dashboard
2. Em **SQL Editor**, rode cada arquivo de `migrations/` em ordem:
   1. `0001_init_multitenancy.sql`
   2. `0002_rbac.sql`
   3. `0003_audit_notifications.sql`
   4. `0004_domain_tables.sql`
   5. `0005_signup_rpc.sql`
3. Rode os arquivos de `seeds/` em ordem.

## Convenções

- Toda tabela de domínio tem `company_id` + RLS isolado por tenant.
- Toda tabela tem `created_at`/`updated_at` (trigger automático).
- Soft delete via `deleted_at`.
- Permissões são granulares: `<module>.<action>`.
- Empresa ativa é lida do JWT (`app_metadata.current_company_id`).
- Funções RPC: `create_company_with_owner`, `switch_active_company`.
- Views auxiliares: `my_companies`, `my_permissions`.
