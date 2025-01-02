// Set up emulator environment variables first
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
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

function getAdminConfig(): AppOptions {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  const projectId = useEmulators
    ? 'churnistic'
    : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('Firebase Project ID is not set in environment variables');
  }

  if (useEmulators) {
    console.log('🔧 Initializing Admin App in Emulator mode');
    return {
      projectId,
    };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return {
      credential: cert(serviceAccount),
      projectId,
    };
  } catch {
    throw new Error(
      'Invalid service account key format. Please ensure the key is properly formatted JSON.'
    );
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

      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
        console.log(
          '📚 Connecting Admin to Firestore Emulator at:',
          process.env.FIRESTORE_EMULATOR_HOST
        );
        adminDb.settings({
          host: process.env.FIRESTORE_EMULATOR_HOST,
          ssl: false,
        });
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

export function getAdminApp(): App {
  if (!adminApp) {
    const config = getAdminConfig();
    adminApp = getApps().length ? getApps()[0] : initializeApp(config);
  }
  return adminApp;
}

export type { App, Auth, Firestore };
