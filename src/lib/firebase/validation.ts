import { z } from 'zod';

import { FirebaseConfigError } from '@/lib/errors/firebase';

import { FIREBASE_ENVIRONMENTS } from './constants';
import { shouldUseEmulators } from './utils/environment';

export const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  authDomain: z.string().min(1, 'Auth domain is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  storageBucket: z.string().min(1, 'Storage bucket is required'),
  messagingSenderId: z.string().min(1, 'Messaging sender ID is required'),
  appId: z.string().min(1, 'App ID is required'),
});

export const environmentVariablesSchema = z.object({
  NEXT_PUBLIC_FIREBASE_ENV: z
    .enum([
      FIREBASE_ENVIRONMENTS.local,
      FIREBASE_ENVIRONMENTS.preview,
      FIREBASE_ENVIRONMENTS.development,
      FIREBASE_ENVIRONMENTS.production,
    ])
    .default(FIREBASE_ENVIRONMENTS.development),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z.enum(['true', 'false']).optional(),
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1, 'Firebase admin project ID is required'),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email('Invalid Firebase admin client email'),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1, 'Firebase admin private key is required'),
});

/**
 * Validates Firebase configuration
 * @param config Configuration object to validate
 * @returns Validated configuration object
 * @throws FirebaseConfigError if validation fails
 */
export function validateFirebaseConfig(config: unknown) {
  try {
    return firebaseConfigSchema.parse(config);
  } catch (error) {
    throw new FirebaseConfigError(
      'config/invalid',
      'Invalid Firebase configuration',
      error
    );
  }
}

/**
 * Validates environment variables
 * @returns Validated environment variables object
 * @throws FirebaseConfigError if validation fails
 */
export function validateEnvironmentVariables() {
  try {
    return environmentVariablesSchema.parse(process.env);
  } catch (error) {
    throw new FirebaseConfigError(
      'config/invalid-env',
      'Invalid environment variables',
      error
    );
  }
}

/**
 * Gets and validates Firebase configuration
 * @returns Validated Firebase configuration
 */
export async function getValidatedFirebaseConfig() {
  try {
    // In emulator mode, we only need projectId
    if (shouldUseEmulators()) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic';
      console.log('🔧 Using Firebase Emulator with project:', projectId);

      return {
        apiKey: 'fake-api-key',
        authDomain: 'localhost',
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      };
    }

    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const validatedConfig = firebaseConfigSchema.parse(config);
    return validatedConfig;
  } catch (error) {
    console.error('Firebase config validation error:', error);
    throw new FirebaseConfigError(
      'config/invalid',
      'Invalid Firebase configuration',
      error
    );
  }
}
