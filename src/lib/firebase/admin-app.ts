import { getApps, initializeApp, cert, App, AppOptions } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function getAdminConfig(): AppOptions {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  const projectId = useEmulators ? 'churnistic' : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('Project ID is not set');
  }

  if (useEmulators) {
    // In emulator mode, we need to match the project ID with the client app
    return {
      projectId,
      credential: {
        getAccessToken: () => Promise.resolve({
          access_token: 'local-emulator-token',
          expires_in: 3600
        })
      }
    };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return {
      credential: cert(serviceAccount),
      projectId
    };
  } catch {
    throw new Error('Invalid service account key format');
  }
}

export function initializeAdminAuth(): Auth {
  try {
    if (!adminApp) {
      const config = getAdminConfig();
      console.log('Initializing Admin App with config:', {
        projectId: config.projectId,
        useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
      });
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

export function initializeAdminDb(): Firestore {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  if (useEmulators) {
    throw new Error('Firestore Admin is not available in emulator mode');
  }

  try {
    if (!adminApp) {
      const config = getAdminConfig();
      adminApp = getApps().length ? getApps()[0] : initializeApp(config);
    }
    
    if (!adminDb) {
      adminDb = getFirestore(adminApp);
    }
    
    return adminDb;
  } catch (error) {
    console.error('Failed to initialize Admin Firestore:', error);
    throw error;
  }
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    return initializeAdminAuth();
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    return initializeAdminDb();
  }
  return adminDb;
}

export function getAdminApp(): App {
  if (!adminApp) {
    const config = getAdminConfig();
    adminApp = getApps().length ? getApps()[0] : initializeApp(config);
  }
  return adminApp;
}
