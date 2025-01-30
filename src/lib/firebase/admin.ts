import {
  type App,
  type AppOptions,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import './emulator-setup';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function getAdminConfig(): AppOptions {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  const projectId =
    process.env.GCLOUD_PROJECT ||
    (useEmulators
      ? 'demo-churnistic-local'
      : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

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
  } catch (error) {
    console.error('Error parsing service account key:', error);
    throw new Error(
      'Invalid service account key format. Please ensure the key is properly formatted JSON.'
    );
  }
}

// Initialize both Auth and Firestore
let isInitialized = false;

async function initializeAdmin() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('Initializing Firebase Admin...');

    // Initialize app first if needed
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }

    // Initialize Auth
    if (!adminAuth) {
      adminAuth = getAuth(adminApp);
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        console.log('🔐 Connecting Admin to Auth Emulator at: localhost:9099');
      }
    }

    // Initialize Firestore
    if (!adminDb) {
      adminDb = getFirestore(adminApp);
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        console.log('📚 Connecting Admin to Firestore Emulator at: localhost:8080');
      }
    }

    isInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    isInitialized = false;
    throw error;
  }
}

// Initialize on module load
void initializeAdmin();

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    throw new Error('Firebase Admin Firestore not initialized');
  }
  return adminDb;
}

export function getAdminApp(): App {
  if (!adminApp) {
    throw new Error('Firebase Admin App not initialized');
  }
  return adminApp;
}

export { adminApp as app, adminAuth as auth, adminDb as db };
export type { App, Auth, Firestore };
