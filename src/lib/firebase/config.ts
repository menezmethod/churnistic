import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

import { FirebaseConfigError } from '@/lib/errors/firebase';
import { FirebaseServices } from '@/types/firebase';

import { DEFAULT_EMULATOR_CONFIG } from './constants';
import { shouldUseEmulators } from './utils/environment';
import { getValidatedFirebaseConfig } from './validation';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

/**
 * Initializes Firebase app if not already initialized
 * @returns Initialized Firebase app instance
 */
export async function initializeFirebaseApp(): Promise<FirebaseApp> {
  if (!app && getApps().length === 0) {
    try {
      const config = await getValidatedFirebaseConfig();
      app = initializeApp(config);

      // Connect to emulators in development
      if (shouldUseEmulators()) {
        console.log('🔧 Connecting to Firebase emulators...');
        const { host, ports } = DEFAULT_EMULATOR_CONFIG;

        // Initialize auth first
        const auth = getAuth(app);
        connectAuthEmulator(auth, `http://${host}:${ports.auth}`, {
          disableWarnings: true,
        });
        console.log(`🔐 Connected to Auth emulator: http://${host}:${ports.auth}`);

        // Then initialize Firestore
        const firestore = getFirestore(app);
        connectFirestoreEmulator(firestore, host, ports.firestore);
        console.log(
          `📚 Connected to Firestore emulator: http://${host}:${ports.firestore}`
        );

        // Initialize Storage
        const storage = getStorage(app);
        connectStorageEmulator(storage, host, ports.storage);
        console.log(`📦 Connected to Storage emulator: http://${host}:${ports.storage}`);

        // Initialize Functions
        const functions = getFunctions(app);
        connectFunctionsEmulator(functions, host, ports.functions);
        console.log(
          `⚡ Connected to Functions emulator: http://${host}:${ports.functions}`
        );
      }
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new FirebaseConfigError(
        'config/initialization-failed',
        'Failed to initialize Firebase app',
        error
      );
    }
  }
  return app!;
}

/**
 * Gets Firebase services with proper initialization
 * @returns Object containing initialized Firebase services
 */
export async function getFirebaseServices(): Promise<FirebaseServices> {
  if (!app) {
    app = await initializeFirebaseApp();
  }

  if (!auth) {
    auth = getAuth(app);
  }

  if (!firestore) {
    firestore = getFirestore(app);
  }

  if (!storage) {
    storage = getStorage(app);
  }

  if (!functions) {
    functions = getFunctions(app);
  }

  return {
    app,
    auth,
    firestore,
    storage,
    functions,
  };
}

/**
 * Resets Firebase services (useful for testing)
 */
export function resetFirebaseServices(): void {
  app = undefined;
  auth = undefined;
  firestore = undefined;
  storage = undefined;
  functions = undefined;
}
