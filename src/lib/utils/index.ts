import { timingSafeEqual } from 'crypto';

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
