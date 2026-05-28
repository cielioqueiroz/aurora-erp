import { createResourceHooks } from '@/hooks/useResource';
import { productsRepository } from '@/repositories/productsRepository';
import { categoriesRepository } from '@/repositories/categoriesRepository';

export const productsHooks = createResourceHooks('products', productsRepository);
export const categoriesHooks = createResourceHooks('categories', categoriesRepository);
