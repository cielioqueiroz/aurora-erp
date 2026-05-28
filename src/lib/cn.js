import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classNames condicionais e resolve conflitos do Tailwind.
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
