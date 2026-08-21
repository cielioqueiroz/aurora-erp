# Payments e Receivables respondem perguntas diferentes

O schema carrega duas tabelas que registram o mesmo dinheiro por ângulos diferentes — `payments`, presa ao pedido, e `finance_transactions`, presa à empresa — e nada no código as concilia: o detalhe do pedido lê uma, o módulo Financeiro lê a outra. Decidimos que **`finance_transactions` é a fonte da verdade do que se deve e quando vence; `payments` registra apenas como e quando foi pago.**

Cada tabela responde uma pergunta que a outra não responde:

- **Receivable**: quanto me devem, com que vencimento, e essa cobrança está em aberto?
- **Payment**: por qual meio e em que data o dinheiro entrou?

## Considered Options

- **`payments` como fonte da verdade, Receivable como projeção** — rejeitado porque o Financeiro precisa enxergar dinheiro que não nasce de pedido nenhum (aluguel, imposto, serviço avulso). Só funcionaria num sistema onde toda receita vem de venda.
- **Aposentar `payments`, movendo o meio de pagamento para o Receivable** — tentador pela simplicidade, mas mata pagamento parcial e pagamento misto ("metade no pix, metade no cartão"), que são comuns numa PME.

## Consequences

- Um Order confirmado origina exatamente um Receivable; parcelamento (vários Receivables por Order) fica como evolução natural, e o modelo atual é o caso de uma parcela só.
- Um Receivable pode acumular vários Payments. O Order só chega a `paid` quando o Receivable está liquidado — não quando o primeiro Payment é registrado.
- Reembolsar não edita o Receivable pago: gera um Payable de devolução, preservando o histórico de que o dinheiro entrou e depois saiu.
