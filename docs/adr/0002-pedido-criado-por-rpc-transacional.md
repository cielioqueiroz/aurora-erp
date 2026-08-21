# Pedido é criado por RPC transacional, não pelo repositório

Todo o resto do app escreve pelo padrão de repositório genérico: um `insert` por chamada, direto do cliente. **Criar um Order foge desse padrão e passa por uma RPC `security definer` no Postgres**, que grava cabeçalho, itens, movimentações de estoque e recebível numa única transação.

Três razões independentes, cada uma suficiente sozinha:

1. **Atomicidade.** Um Order são no mínimo duas escritas (cabeçalho e itens) e, com a confirmação, quatro. Sem transação, qualquer falha de rede no meio deixa um pedido órfão sem itens.
2. **Numeração sem corrida.** O Order Code é sequencial por empresa e por ano. Gerá-lo no cliente, ou por `max + 1`, colide sob concorrência — a unicidade precisa ser garantida dentro da transação que insere.
3. **Permissões.** O papel `operator` — justamente o de vendas — tem `orders.create` mas não tem `finance.create`. Pelas policies de RLS, ele jamais conseguiria inserir o Receivable a partir do cliente. Dentro de uma função `security definer`, a autorização checada é a de _pedido_, que é a semanticamente correta: quem pode vender pode gerar a cobrança daquela venda, sem por isso ganhar acesso ao módulo Financeiro.

## Consequences

- É uma exceção deliberada ao padrão de repositório. Quem encontrar isso e quiser "consertar" movendo para o `baseRepository` vai reintroduzir os três problemas acima.
- Sendo `security definer`, a função é responsável por validar tenancy e permissão explicitamente — o RLS não protege dentro dela.
