import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

import { FirebaseConfigError } from '@/lib/errors/firebase';
import { FirebaseServices } from '@/types/firebase';

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
      app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
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

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default firebaseConfig;
