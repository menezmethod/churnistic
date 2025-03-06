import { type ClassValue, clsx } from 'clsx';
import { timingSafeEqual } from 'crypto';
import { twMerge } from 'tailwind-merge';

/**
 * Safely compares two strings in a timing-safe manner
 */
export const compareStrings = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};
export { timingSafeEqual };

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
