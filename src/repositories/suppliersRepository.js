import { createRepository } from './baseRepository';
import { demoSuppliers } from '@/app/demoFixtures';

export const suppliersRepository = createRepository('suppliers', { demoStore: demoSuppliers });
