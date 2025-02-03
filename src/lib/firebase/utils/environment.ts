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
  // In browser, check if we're on localhost
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost';
  }

  // In Node.js (SSR), check if we're in development
  return process.env.NODE_ENV === 'development';
}

/**
 * Gets the appropriate collection prefix for the current environment
 * @returns Collection prefix string
 */
export function getCollectionPrefix(): string {
  const env = getCurrentEnvironment();
  return env === FIREBASE_ENVIRONMENTS.production ? '' : `${env}_`;
}

/**
 * Gets the full collection name with environment prefix
 * @param baseCollectionName Base collection name
 * @returns Full collection name with environment prefix
 */
export function getFullCollectionName(baseCollectionName: string): string {
  return `${getCollectionPrefix()}${baseCollectionName}`;
}
