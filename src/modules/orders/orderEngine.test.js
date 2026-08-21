import { describe, it, expect } from 'vitest';
import {
  demoProducts,
  demoOrderItems,
  demoInventoryMovements,
  demoFinanceTransactions,
  demoPayments,
  demoStockBalance,
  demoCreateOrder,
  demoConfirmOrder,
  demoCancelOrder,
  demoPayOrder,
  demoRefundOrder,
} from '@/app/demoFixtures';
import { calculateItemTotal, calculateOrderTotals } from '@/validations/order';

const product = (index) => demoProducts[index];
const balanceOf = (productId) =>
  demoStockBalance().find((row) => row.product_id === productId)?.balance ?? 0;
const movementsOf = (orderId) => demoInventoryMovements.filter((m) => m.reference_id === orderId);
const financeOf = (orderId) => demoFinanceTransactions.filter((t) => t.reference_id === orderId);

describe('cálculo de totais', () => {
  it('desconta o item antes de somar o subtotal', () => {
    expect(calculateItemTotal({ quantity: 3, unitPrice: 10, discount: 5 })).toBe(25);
  });

  it('subtotal é líquido de item e o desconto do pedido incide depois', () => {
    const totals = calculateOrderTotals(
      [
        { quantity: 2, unitPrice: 100, discount: 20 },
        { quantity: 1, unitPrice: 50, discount: 0 },
      ],
      30,
    );
    expect(totals.subtotal).toBe(230);
    expect(totals.total).toBe(200);
  });
});

describe('criação de pedido', () => {
  it('gera código sequencial por ano no formato PED-YYYY-NNNNNN', () => {
    const year = new Date().getFullYear();
    const first = demoCreateOrder({ items: [{ product_id: product(0).id, quantity: 1 }] });
    const second = demoCreateOrder({ items: [{ product_id: product(0).id, quantity: 1 }] });

    expect(first.code).toMatch(new RegExp(`^PED-${year}-\\d{6}$`));
    expect(second.code).not.toBe(first.code);
    expect(Number(second.code.slice(-6))).toBe(Number(first.code.slice(-6)) + 1);
  });

  it('rascunho não toca em estoque nem em financeiro', () => {
    const target = product(1);
    const before = balanceOf(target.id);
    const order = demoCreateOrder({ items: [{ product_id: target.id, quantity: 2 }] });

    expect(order.status).toBe('draft');
    expect(balanceOf(target.id)).toBe(before);
    expect(movementsOf(order.id)).toHaveLength(0);
    expect(financeOf(order.id)).toHaveLength(0);
  });

  it('usa o preço do cadastro e ignora preço vindo do cliente', () => {
    const target = product(2);
    const order = demoCreateOrder({
      items: [{ product_id: target.id, quantity: 2, unit_price: 0.01 }],
    });
    const item = demoOrderItems.find((i) => i.order_id === order.id);

    expect(item.unit_price).toBe(target.price);
    expect(order.total).toBe(Math.round(target.price * 2 * 100) / 100);
  });

  it('recusa quantidade zero ou negativa', () => {
    expect(() => demoCreateOrder({ items: [{ product_id: product(0).id, quantity: 0 }] })).toThrow(
      /Quantidade/,
    );
  });

  it('recusa desconto de pedido maior que o subtotal', () => {
    expect(() =>
      demoCreateOrder({
        items: [{ product_id: product(0).id, quantity: 1 }],
        discount: 999999,
      }),
    ).toThrow(/maior que o subtotal/);
  });
});

describe('confirmação é o commit', () => {
  it('baixa estoque com custo e cria recebível pendente', () => {
    const target = product(3);
    const before = balanceOf(target.id);
    const order = demoCreateOrder({
      items: [{ product_id: target.id, quantity: 2 }],
      confirm: true,
      dueDate: '2026-12-31',
    });

    expect(order.status).toBe('confirmed');
    expect(balanceOf(target.id)).toBe(before - 2);

    const movements = movementsOf(order.id);
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe('out');
    expect(movements[0].unit_cost).toBe(target.cost);

    const receivables = financeOf(order.id);
    expect(receivables).toHaveLength(1);
    expect(receivables[0].type).toBe('receivable');
    expect(receivables[0].status).toBe('pending');
    expect(receivables[0].due_date).toBe('2026-12-31');
    expect(receivables[0].amount).toBe(order.total);
  });

  it('saldo insuficiente bloqueia e não escreve nada', () => {
    const target = product(4);
    const movementsBefore = demoInventoryMovements.length;
    const financeBefore = demoFinanceTransactions.length;

    expect(() =>
      demoCreateOrder({
        items: [{ product_id: target.id, quantity: 999999 }],
        confirm: true,
      }),
    ).toThrow(/Saldo insuficiente/);

    expect(demoInventoryMovements).toHaveLength(movementsBefore);
    expect(demoFinanceTransactions).toHaveLength(financeBefore);
    expect(balanceOf(target.id)).toBeGreaterThan(0);
  });
});

describe('transições e compensações', () => {
  it('cancelar confirmado estorna o estoque sem apagar a saída original', () => {
    const target = product(5);
    const before = balanceOf(target.id);
    const order = demoCreateOrder({
      items: [{ product_id: target.id, quantity: 3 }],
      confirm: true,
    });
    expect(balanceOf(target.id)).toBe(before - 3);

    demoCancelOrder(order.id);

    expect(balanceOf(target.id)).toBe(before);
    const movements = movementsOf(order.id);
    expect(movements).toHaveLength(2);
    expect(movements.map((m) => m.type).sort()).toEqual(['in', 'out']);
    expect(financeOf(order.id)[0].status).toBe('cancelled');
  });

  it('pagar liquida o recebível e registra a forma de pagamento', () => {
    const order = demoCreateOrder({
      items: [{ product_id: product(6).id, quantity: 1 }],
      confirm: true,
    });
    demoPayOrder(order.id, 'pix');

    expect(order.status).toBe('paid');
    expect(financeOf(order.id)[0].status).toBe('paid');
    const payment = demoPayments.find((p) => p.order_id === order.id);
    expect(payment.method).toBe('pix');
    expect(payment.amount).toBe(order.total);
  });

  it('reembolso cria pagável de devolução e preserva o recebimento', () => {
    const order = demoCreateOrder({
      items: [{ product_id: product(7).id, quantity: 1 }],
      confirm: true,
    });
    demoPayOrder(order.id, 'boleto');
    demoRefundOrder(order.id);

    expect(order.status).toBe('refunded');
    const entries = financeOf(order.id);
    expect(entries.find((t) => t.type === 'receivable').status).toBe('paid');
    expect(entries.find((t) => t.type === 'payable').category).toBe('Reembolsos');
  });

  it('rejeita transições ilegais', () => {
    const order = demoCreateOrder({ items: [{ product_id: product(0).id, quantity: 1 }] });

    expect(() => demoPayOrder(order.id, 'pix')).toThrow(/confirmado/);
    expect(() => demoRefundOrder(order.id)).toThrow(/pago/);

    demoConfirmOrder(order.id);
    expect(() => demoConfirmOrder(order.id)).toThrow(/rascunho/);

    demoCancelOrder(order.id);
    expect(() => demoCancelOrder(order.id)).toThrow(/rascunho ou confirmado/);
    expect(() => demoConfirmOrder(order.id)).toThrow(/rascunho/);
  });
});
