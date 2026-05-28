import { createRepository } from './baseRepository';
import { demoProducts } from '@/app/demoFixtures';

export const productsRepository = createRepository('products', { demoStore: demoProducts });
