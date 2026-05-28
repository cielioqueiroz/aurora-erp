import { createResourceHooks } from '@/hooks/useResource';
import { customersRepository } from '@/repositories/customersRepository';

export const customersHooks = createResourceHooks('customers', customersRepository);
