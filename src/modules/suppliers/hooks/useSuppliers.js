import { createResourceHooks } from '@/hooks/useResource';
import { suppliersRepository } from '@/repositories/suppliersRepository';

export const suppliersHooks = createResourceHooks('suppliers', suppliersRepository);
