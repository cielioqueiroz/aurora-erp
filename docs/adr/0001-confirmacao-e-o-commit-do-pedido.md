# Confirmação é o commit do pedido

Os cinco estados do Order existiam no schema desde o início sem que nenhum deles produzisse efeito: mudar o status era só trocar um texto. Decidimos que **`confirmed` é a transição que compromete o negócio** — é ela que gera as Inventory Movements de saída e faz nascer o Receivable pendente. `draft` não toca em estoque nem em financeiro, e `paid` apenas quita um Receivable que já existe.

## Considered Options

- **`paid` como commit** — estoque só sairia com o dinheiro na mão. Rejeitado porque o módulo Financeiro nunca teria nada em "a receber": todo Receivable nasceria já quitado, e a coluna de vencimento perderia sentido.
- **Commits separados (`confirmed` baixa estoque, `paid` lança o financeiro)** — regime de caixa. Rejeitado pelo mesmo motivo: elimina a noção de recebível pendente, que é metade da razão de existir do módulo Financeiro num ERP.

## Consequences

- Um Order confirmado por engano não se desfaz apagando o registro: exige uma transição de compensação que estorne o estoque e baixe o Receivable.
- O vínculo entre Order, Inventory Movement e Receivable é rastreável pelos campos de referência que já existiam no schema esperando exatamente esse uso.
