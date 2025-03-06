import {
  type App,
  type AppOptions,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

import { shouldUseEmulators } from './utils/environment';

// Use proper singleton variables
let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;
let isInitialized = false;

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

// Main initialization function - initialize only once
async function initializeAdmin() {
  // Return immediately if already initialized
  if (isInitialized) {
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  try {
    // Use lock mechanism to prevent race conditions
    if (getApps().length === 0) {
      console.log('Initializing Firebase Admin...');

      // Initialize app
      const config = getAdminConfig();
      adminApp = initializeApp(config);

      // Initialize Auth
      adminAuth = getAuth(adminApp);
      console.log('Firebase Admin Auth initialized');

      // Initialize Firestore
      adminDb = getFirestore(adminApp);

      // Configure Firestore for emulator if needed
      if (shouldUseEmulators()) {
        adminDb.settings({
          host: 'localhost:8080',
          ssl: false,
          experimentalForceLongPolling: true,
        });
        console.log('📚 Connected Admin to Firestore Emulator at: localhost:8080');
      }

      console.log('Firebase Admin Firestore initialized');
      console.log('Firebase Admin initialized successfully');

      isInitialized = true;
    } else {
      // If already initialized, get the instances
      adminApp = getApps()[0];
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
    }

    return { app: adminApp, auth: adminAuth, db: adminDb };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    isInitialized = false;
    throw error;
  }
}

// Always call initialize on module load
// Use void to handle the promise without waiting
void initializeAdmin();

// Export getters that ensure initialization
export function getAdminApp(): App {
  if (!adminApp) {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
    } else {
      // This will happen only if the initialization failed
      throw new Error('Firebase Admin app not initialized');
    }
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

// Legacy methods for backward compatibility
export async function initializeAdminApp() {
  console.warn('Deprecated: Use getAdminApp() instead of initializeAdminApp()');
  await initializeAdmin();
  return adminApp;
}

export function initializeAdminAuth(): Auth {
  console.warn('Deprecated: Use getAdminAuth() instead of initializeAdminAuth()');
  return getAdminAuth();
}

export function initializeAdminDb(): Firestore {
  console.warn('Deprecated: Use getAdminDb() instead of initializeAdminDb()');
  return getAdminDb();
}

// Export for direct use
export { adminApp as app, adminAuth as auth, adminDb as db };
export type { App, Auth, Firestore };
