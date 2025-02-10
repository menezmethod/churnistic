import { FirebaseEnvironment } from '@/types/firebase';

import { FIREBASE_ENVIRONMENTS } from '../constants';

/**
 * Gets the current Firebase environment
 * @returns Current Firebase environment
 */
export function getCurrentEnvironment(): FirebaseEnvironment {
  const env = process.env.NEXT_PUBLIC_FIREBASE_ENV || FIREBASE_ENVIRONMENTS.development;
  if (!Object.values(FIREBASE_ENVIRONMENTS).includes(env)) {
    console.warn(`Invalid environment "${env}", falling back to development`);
    return 'development';
  }
  return env as FirebaseEnvironment;
}

/**
 * Checks if the current environment is production
 * @returns boolean indicating if current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === FIREBASE_ENVIRONMENTS.production;
}

/**
 * Checks if Firebase emulators should be used
 * @returns boolean indicating if emulators should be used
 */
export function shouldUseEmulators(): boolean {
  return false;
}

/**
 * Gets the full collection name
 * @param baseCollectionName Base collection name
 * @returns The collection name
 */
export function getFullCollectionName(baseCollectionName: string): string {
  return baseCollectionName;
}
