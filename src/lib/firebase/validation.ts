import { z } from 'zod';

import { FirebaseConfigError } from '@/lib/errors/firebase';

import { FIREBASE_ENVIRONMENTS } from './constants';

export const firebaseConfigSchema = z.object({
  apiKey: z.string(),
  authDomain: z.string(),
  projectId: z.string(),
  storageBucket: z.string(),
  messagingSenderId: z.string(),
  appId: z.string(),
  measurementId: z.string().optional(),
  clientEmail: z.string(),
  privateKey: z.string(),
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
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string(),
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
    const env = environmentVariablesSchema.parse(process.env);

    // Client config
    const clientConfig = {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Server credentials
    const serviceAccount = JSON.parse(
      Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString()
    );

    return {
      ...clientConfig,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    };
  } catch (error) {
    console.error('Firebase config validation failed:', error);
    throw new FirebaseConfigError(
      'config/validation-failed',
      'Invalid Firebase configuration',
      error
    );
  }
}
