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
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
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
      credential: {
        getAccessToken: () => Promise.resolve({ 
          access_token: 'owner', 
          expires_in: 3600 
        }),
      },
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

export function initializeAdminDb(): Firestore {
  try {
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }

    if (!adminDb) {
      adminDb = getFirestore(adminApp);

      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        console.log('📚 Connecting Admin to Firestore Emulator at: localhost:8080');
        adminDb.settings({
          host: 'localhost:8080',
          ssl: false,
          ignoreUndefinedProperties: true,
        });
      } else {
        adminDb.settings({
          ignoreUndefinedProperties: true,
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
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
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
