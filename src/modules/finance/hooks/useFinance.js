import { createResourceHooks } from '@/hooks/useResource';
import { financeRepository } from '@/repositories/financeRepository';

export const financeHooks = createResourceHooks('finance_transactions', financeRepository);
