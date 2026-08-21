# Aurora ERP

Sistema de gestão multi-tenant para PMEs brasileiras. Cada empresa cliente opera isolada das demais, com controle de acesso granular por módulo.

Glossário do domínio. O termo canônico está em inglês (igual ao schema e ao código); a definição, em PT-BR. Este arquivo não descreve implementação — só o que cada termo significa.

## Tenancy e acesso

**Company** (Empresa):
A organização cliente que assina o sistema. É a fronteira de isolamento: todo dado do domínio pertence a exatamente uma Company.
_Avoid_: tenant, cliente, conta, organização

**Customer** (Cliente):
Pessoa física ou jurídica que compra da Company. Nunca é quem usa o sistema.
_Avoid_: cliente (sozinho, ambíguo com Company), comprador, conta

**Member** (Membro):
Um usuário vinculado a uma Company, com exatamente um Role naquela Company. O mesmo usuário pode ser Member de várias Companies.
_Avoid_: usuário da empresa, colaborador

**Role** (Papel):
Conjunto nomeado de Permissions atribuído a um Member.
_Avoid_: perfil, grupo, nível de acesso

**Permission** (Permissão):
Autorização atômica para uma ação num módulo, nomeada `<module>.<action>`.
_Avoid_: privilégio, acesso, direito

## Pedidos

**Order** (Pedido):
Uma venda da Company para um Customer. Nasce como intenção editável e, ao ser confirmada, vira um fato que move estoque e financeiro.
_Avoid_: venda, compra, transação

**Order Code** (Código do pedido):
Identificador do Order legível por humanos, único dentro da Company e sequencial dentro do ano.
_Avoid_: número do pedido, ID do pedido

**Order Item** (Item do pedido):
Uma linha do Order: um Product, uma quantidade e o preço praticado. O preço registrado no Item é histórico — não acompanha mudanças posteriores no preço do Product.
_Avoid_: linha, produto do pedido

**Walk-in Order** (Venda sem identificação):
Order deliberadamente registrado sem Customer, como uma venda de balcão. É uma escolha explícita de quem registra, não um campo esquecido.
_Avoid_: venda avulsa, pedido anônimo

### Estados do Order

**Draft** (Rascunho):
Order ainda em montagem. Não reservou estoque nem gerou nada no financeiro. Só existe como intenção.

**Confirmed** (Confirmado):
Order comprometido. É a transição que baixa estoque e faz nascer o Receivable. A partir daqui o Order é um fato, não uma intenção.

**Paid** (Pago):
Order confirmado cujo Receivable foi quitado.

**Cancelled** (Cancelado):
Order desfeito antes da quitação.

**Refunded** (Reembolsado):
Order desfeito depois de já ter sido pago.

### Valores do Order

**Subtotal**:
Soma dos Order Items, já líquida dos descontos de item. Nunca é um valor bruto.

**Item Discount** (Desconto de item):
Abatimento aplicado a uma linha específica, tipicamente por negociação naquele produto.

**Order Discount** (Desconto do pedido):
Abatimento aplicado ao Order fechado, depois do Subtotal. É adicional aos Item Discounts, não os substitui.

**Total**:
Subtotal menos o Order Discount. É o valor que o Customer deve.

## Estoque

**Inventory Movement** (Movimentação de estoque):
O registro de uma entrada, saída ou ajuste da quantidade de um Product. É o único fato de estoque que o sistema guarda.
_Avoid_: lançamento, transação de estoque

**Stock Balance** (Saldo de estoque):
A quantidade atual de um Product, obtida somando suas Inventory Movements. É sempre derivado — o sistema não guarda saldo, guarda o histórico que o produz.
_Avoid_: estoque atual, quantidade em mãos

## Financeiro

**Receivable** (Recebível):
Uma cobrança que a Company tem a receber, com valor e data de vencimento. Um Order confirmado origina um Receivable.
_Avoid_: conta a receber, fatura, cobrança

**Payable** (Pagável):
Uma obrigação que a Company tem a pagar.
_Avoid_: conta a pagar, despesa

**Payment** (Pagamento):
O registro de _como_ e _quando_ um Receivable foi liquidado — meio (pix, boleto, dinheiro, cartão) e data. Um Receivable pode ter mais de um Payment. Nunca é a fonte da verdade de quanto se deve.
_Avoid_: recebimento, baixa, quitação

## Compensação

**Compensation** (Compensação):
Um fato novo que anula o efeito de outro sem apagá-lo. Desfazer um Order confirmado não remove sua saída de estoque nem seu Receivable — cria os fatos opostos. O histórico do sistema é sempre append-only.
_Avoid_: estorno, reversão, rollback

**Refund** (Reembolso):
A devolução de dinheiro já recebido. Como o Receivable original permanece pago, o reembolso nasce como um Payable de devolução, não como uma edição do recebimento.
_Avoid_: estorno, cancelamento
