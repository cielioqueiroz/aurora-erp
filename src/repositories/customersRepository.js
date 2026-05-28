import { createRepository } from './baseRepository';
import { demoCustomers } from '@/app/demoFixtures';

export const customersRepository = createRepository('customers', { demoStore: demoCustomers });
