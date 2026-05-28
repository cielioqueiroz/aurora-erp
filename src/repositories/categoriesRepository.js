import { createRepository } from './baseRepository';
import { demoCategories } from '@/app/demoFixtures';

export const categoriesRepository = createRepository('categories', { demoStore: demoCategories });
