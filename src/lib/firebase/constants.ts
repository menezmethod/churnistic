import { FirebaseEnvironment, EmulatorConfig } from '@/types/firebase';

export const FIREBASE_ENVIRONMENTS: Record<FirebaseEnvironment, string> = {
  local: 'local',
  preview: 'preview',
  development: 'development',
  production: 'production',
};

export const DEFAULT_EMULATOR_CONFIG: EmulatorConfig = {
  host: 'localhost',
  ports: {
    auth: 9099,
    firestore: 8080,
    storage: 9199,
    functions: 5001,
  },
};

export const FIREBASE_AUTH_ERRORS = {
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  REQUIRES_RECENT_LOGIN: 'auth/requires-recent-login',
} as const;

export const COLLECTION_NAMES = {
  USERS: 'users',
  OPPORTUNITIES: 'opportunities',
  SETTINGS: 'settings',
} as const;

export const MAX_BATCH_SIZE = 500;
export const DEFAULT_PAGE_SIZE = 25;
