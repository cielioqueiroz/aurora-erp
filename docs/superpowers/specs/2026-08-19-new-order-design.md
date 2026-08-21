# Novo Pedido — Design

Data: 2026-08-19
Pendência de origem: RESUME.md #8
Decisões registradas: docs/adr/0001, 0002, 0003
Glossário: CONTEXT.md

## Objetivo

Destravar o fluxo de venda fim-a-fim: registrar um Order com itens, confirmar, e ver estoque e financeiro se moverem em consequência. Hoje o botão em `src/modules/orders/pages/OrdersListPage.jsx:137` está desabilitado e nenhum dos cinco status do Order produz efeito.

## Fora do escopo (dívida assumida, explicitamente)

- Parcelamento (N Receivables por Order). O modelo entregue é o caso de uma parcela; ver ADR 0003.
- Preço unitário editável na venda. Fica travado no preço do Product; exigiria uma permission nova e o editor granular de roles (pendência #12).
- Pagamento parcial e pagamento misto. A tabela `payments` existe e a modelagem os comporta, mas a UI não os expõe nesta entrega.
- Nota fiscal, frete, impostos.

## Decisões de design

1. **`confirmed` é o commit.** Baixa estoque e cria o Receivable. `draft` não toca em nada. (ADR 0001)
2. **A escrita passa por RPC `security definer`**, não pelo `baseRepository`. (ADR 0002)
3. **`finance_transactions` é a fonte da verdade da dívida; `payments`, do recebimento.** (ADR 0003)
4. **Order Code** no formato `PED-YYYY-NNNNNN`, sequencial por empresa e por ano, gerado dentro da transação.
5. **Customer é opcional**, como escolha explícita ("venda sem identificação"), não como campo esquecido.
6. **Desconto existe nos dois níveis**, com a regra: `item.total = quantity × unit_price − item.discount`; `order.subtotal = Σ item.total` (já líquido); `order.total = subtotal − order.discount`.
7. **Estoque insuficiente bloqueia a confirmação**, listando os itens em falta.
8. **A saída de estoque grava `unit_cost`** com o custo do Product no momento da venda, para que margem e CMV não sejam recalculados retroativamente.
9. **Order confirmado é imutável.** Só `draft` é editável. Desfazer é sempre compensação, nunca edição.
10. **Pedido nunca é deletado fisicamente.** A policy `orders_delete` sai; `orders.cancel` passa a significar cancelar, que é o que o nome sempre prometeu.

## Máquina de estados

```
draft     → confirmed   (orders.update)   saída de estoque + Receivable pendente
draft     → cancelled   (orders.cancel)   nada a compensar
confirmed → paid        (orders.update)   liquida o Receivable, registra o Payment
confirmed → cancelled   (orders.cancel)   entrada de estoque + Receivable cancelado
paid      → refunded    (orders.refund)   entrada de estoque + Payable de devolução
cancelled, refunded                       terminais
```

Toda transição não listada é rejeitada pela RPC. Não existe caminho de volta, e não existe `draft → paid` direto — pular o commit deixaria estoque e financeiro sem lastro.

Consequência de permissões a encarar: `operator` tem `orders.create` e `orders.update`, mas **não** tem `orders.cancel` nem `orders.refund`. Ou seja, o vendedor registra e confirma, mas não desfaz — precisa de um `manager`. É o comportamento correto para um ERP, mas é uma mudança perceptível de UX e a interface precisa explicá-la em vez de só desabilitar o botão.

## Contrato de banco (migration 0007)

### `public.order_counters`

Contador por `(company_id, year)`, travado com `select ... for update` dentro da transação. Não usar `max(code) + 1`: colide sob concorrência.

### `public.product_stock_balance` (view)

Saldo por Product, agregado no Postgres. Existe porque a RPC precisa dele, e de quebra corrige o bug de `inventoryRepository.getStockBalance`, que hoje soma as movimentações no browser sobre um `select` sem paginação — truncado em 1000 linhas pelo PostgREST, portanto silenciosamente errado assim que a empresa passa desse volume.

### RPCs (todas `security definer`, todas validam tenancy e permissão explicitamente)

- `create_order(p_customer_id, p_items jsonb, p_discount, p_notes, p_due_date, p_confirm boolean)`
  Gera o code, insere cabeçalho e itens, calcula subtotal e total. Se `p_confirm`, valida saldo de todos os itens antes de qualquer escrita de estoque, insere as movimentações `out` com `unit_cost`, e cria o Receivable. Retorna o Order.
- `confirm_order(p_order_id)` — o commit de um draft existente.
- `cancel_order(p_order_id)` — compensa conforme o estado de origem.
- `refund_order(p_order_id)` — entrada de estoque + Payable de devolução.
- `pay_order(p_order_id, p_method, p_paid_at)` — liquida o Receivable, insere o Payment, move o Order para `paid`.

Erros de domínio saem como `raise exception` com mensagem em PT-BR, para o `unwrap` do `src/integrations/supabase/errors.js` propagar ao toast.

## Frontend

**Rota nova**: `/orders/new` e `/orders/:id/edit` (só para `draft`).

**Página, não sheet, e tela única, não passos.** A tabela de itens precisa de largura para produto, quantidade, preço, desconto e total — o `CrudSheet` em `max-w-2xl` fica apertado. E registrar pedido é tarefa repetitiva de alta frequência: um fluxo de passos numerados protege o usuário de primeira viagem e atrasa todo mundo depois disso. Apesar do nome "wizard" na pendência #8, o formato entregue é uma tela só.

Blocos, de cima para baixo: Customer (com alternativa explícita "venda sem identificação") · busca de Product por nome ou SKU, mostrando o saldo ao lado de cada opção e listando apenas produtos ativos · tabela de itens com quantidade e desconto editáveis · condição de pagamento (à vista / 7 / 15 / 30 / 60 dias / data escolhida) · observações · painel de totais fixo.

Ações: **Confirmar pedido** (primária) e **Salvar rascunho** (secundária).

O `OrderDetailSheet` perde o Select livre de status: cada transição legal vira um botão explícito, gateado pela sua permission, e as ilegais deixam de existir na interface.

## Arquivos

Novos: `supabase/migrations/0007_orders_rpc.sql`, `src/modules/orders/pages/OrderFormPage.jsx`, `src/modules/orders/components/OrderItemsTable.jsx`, `src/modules/orders/components/ProductPicker.jsx`, `src/modules/orders/components/OrderTotals.jsx`, `src/validations/orderSchema.js`.

Modificados: `src/repositories/ordersRepository.js` (métodos de RPC), `src/repositories/inventoryRepository.js` (consumir a view), `src/modules/orders/hooks/useOrders.js`, `src/modules/orders/pages/OrdersListPage.jsx` (habilitar o botão), `src/modules/orders/components/OrderDetailSheet.jsx` (botões por transição), `src/constants/routes.js`, `src/routes/` (registro das rotas).

## Critérios de aceitação

- Confirmar um pedido de 2 itens gera 1 Order, 2 Order Items, 2 Inventory Movements `out` com `unit_cost` preenchido, e 1 Receivable pendente com o vencimento escolhido.
- Dois usuários confirmando ao mesmo tempo recebem codes distintos.
- Confirmar com saldo insuficiente não escreve nada e diz quais produtos faltam.
- Cancelar um pedido confirmado gera Inventory Movements `in` e deixa o Receivable `cancelled`; as movimentações originais permanecem.
- Um `operator` confirma um pedido sem ter `finance.create`.
- Um `operator` não consegue cancelar nem reembolsar.
- `refunded → draft` é rejeitado pela RPC, não só escondido na UI.
- A tela de Estoque mostra o mesmo saldo que a RPC usa para validar.
