import {
  type App,
  type AppOptions,
  cert,
  getApps,
  initializeApp,
  applicationDefault,
} from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

import { FirebaseConfigError } from '@/lib/errors/firebase';

import { shouldUseEmulators } from './utils/environment';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

// Set emulator environment variables if needed
if (shouldUseEmulators()) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  console.log('🔧 Emulator mode - setting up environment variables');
}

function getAdminConfig(): AppOptions {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic';

  if (!projectId) {
    throw new Error('Firebase Project ID is not set in environment variables');
  }

  // In emulator mode, we don't need real credentials
  if (shouldUseEmulators()) {
    console.log('🔧 Initializing Admin App in Emulator mode for project:', projectId);
    return {
      projectId,
    };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    // Instead of throwing an error, return a basic config for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Warning: Using development fallback for Firebase Admin initialization'
      );
      return { projectId };
    }
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.'
    );
  }

  try {
    // Decode base64 encoded service account key
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decodedKey);

    // Validate the service account object has required fields
    if (!serviceAccount || typeof serviceAccount !== 'object') {
      throw new Error('Invalid service account format');
    }

    return {
      credential: cert(serviceAccount),
      projectId,
    };
  } catch (error) {
    // Handle parsing errors gracefully in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Warning: Failed to parse service account key, using development fallback'
      );
      return { projectId };
    }
    console.error('Error parsing service account key:', error);
    throw new Error(
      'Invalid service account key format. Ensure key is base64 encoded JSON.'
    );
  }
}

export async function initializeAdminApp() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (getApps().length === 0) {
    try {
      console.log('🔧 Initializing Admin App for project:', projectId);

      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });

      return app;
    } catch (error) {
      console.error('Failed to initialize Admin App:', error);
      throw new FirebaseConfigError(
        'admin/initialization-failed',
        'Failed to initialize Firebase Admin app',
        error
      );
    }
  }

  return getApps()[0];
}

export function initializeAdminDb(): Firestore {
  try {
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }

    if (!adminDb) {
      adminDb = getFirestore(adminApp);

      if (shouldUseEmulators()) {
        adminDb.settings({
          host: 'localhost:8080',
          ssl: false,
          experimentalForceLongPolling: true,
        });
        console.log('📚 Connected Admin to Firestore Emulator at: localhost:8080');
      }
    }

    return adminDb;
  } catch (error) {
    console.error('Failed to initialize Admin Firestore:', error);
    throw error;
  }
}

export function initializeAdminAuth(): Auth {
  try {
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }

    if (!adminAuth) {
      adminAuth = getAuth(adminApp);
      if (shouldUseEmulators()) {
        console.log('🔐 Connected Admin to Auth Emulator at: localhost:9099');
      }
    }

    return adminAuth;
  } catch (error) {
    console.error('Failed to initialize Admin Auth:', error);
    throw error;
  }
}

export function getAdminAuth(): Auth {
  return adminAuth ?? initializeAdminAuth();
}

export function getAdminDb(): Firestore {
  return adminDb ?? initializeAdminDb();
}

export function getAdminApp(): App {
  if (!adminApp) {
    const config = getAdminConfig();
    adminApp = getApps().length ? getApps()[0] : initializeApp(config);
  }
  return adminApp;
}

// Initialize both Auth and Firestore
let isInitialized = false;

async function initializeAdmin() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('Initializing Firebase Admin...');

    // Initialize Auth first
    initializeAdminAuth();
    console.log('Firebase Admin Auth initialized');

    // Then initialize Firestore
    initializeAdminDb();
    console.log('Firebase Admin Firestore initialized');

    isInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    isInitialized = false;
    throw error;
  }
}

// Initialize on module load
void initializeAdmin();

export { adminApp as app, adminAuth as auth, adminDb as db };
export type { App, Auth, Firestore };

export const getFirebaseAdmin = () => {
  if (!adminApp) {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      adminApp = initializeApp({
        credential: applicationDefault(),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  }
  return adminApp;
};
