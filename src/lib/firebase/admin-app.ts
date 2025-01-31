// IMPORTANT: Environment variables must be set before any firebase imports
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
});

// Set up all emulators if needed
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.STORAGE_EMULATOR_HOST = 'http://localhost:9199';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'http://localhost:9199';

  // Add storage base URL for emulator
  process.env.FIREBASE_STORAGE_BASE_URL = 'http://localhost:9199/v0';
}

import {
  type App,
  type AppOptions,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString(
    'utf-8'
  )
);

function getAdminConfig(): AppOptions {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic';

  // For Vercel deployments
  if (process.env.VERCEL) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required for Vercel deployments');
    }

    try {
      const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedKey);
      return {
        credential: cert(serviceAccount),
        projectId,
      };
    } catch (error) {
      console.error('Error parsing service account key:', error);
      throw error;
    }
  }

  // For local development
  if (useEmulators) {
    console.log('🔧 Initializing Admin App in Emulator mode');
    return {
      projectId,
    };
  }

  // For local production-like environment
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.'
    );
  }

  try {
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decodedKey);
    return {
      credential: cert(serviceAccount),
      projectId,
    };
  } catch (error) {
    console.error('Error parsing service account key:', error);
    throw error;
  }
}

export function initializeAdminDb(): Firestore {
  try {
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }

    if (!adminDb) {
      adminDb = getFirestore(adminApp);

      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        console.log(
          '📚 Connecting Admin to Firestore Emulator at:',
          process.env.FIRESTORE_EMULATOR_HOST
        );
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

export const getAdminApp = () => {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
  return getApps()[0];
};

export type { App, Auth, Firestore };
