import { createRepository } from './baseRepository';
import { demoFinanceTransactions } from '@/app/demoFixtures';

export const financeRepository = createRepository('finance_transactions', {
  demoStore: demoFinanceTransactions,
});
