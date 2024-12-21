import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Check if we're in development mode and should use emulators
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

if (useEmulators) {
  console.log('🔧 Using Firebase Emulator Suite');

  // Auth Emulator
  const authEmulatorHost = 'localhost';
  const authEmulatorPort = 9099;
  connectAuthEmulator(auth, `http://${authEmulatorHost}:${authEmulatorPort}`, {
    disableWarnings: false,
  });
  console.log(`🔑 Connecting to Auth Emulator at: ${authEmulatorHost}:${authEmulatorPort}`);

  // Functions Emulator
  const functionsEmulatorHost = 'localhost';
  const functionsEmulatorPort = 5001;
  connectFunctionsEmulator(functions, functionsEmulatorHost, functionsEmulatorPort);
  console.log('⚡ Connecting to Functions Emulator');

  // Firestore Emulator
  const firestoreEmulatorHost = 'localhost';
  const firestoreEmulatorPort = 8080;
  connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
  console.log('📚 Connecting to Firestore Emulator');

  // Storage Emulator
  const storageEmulatorHost = 'localhost';
  const storageEmulatorPort = 9199;
  connectStorageEmulator(storage, storageEmulatorHost, storageEmulatorPort);
  console.log('📦 Connecting to Storage Emulator');
}

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Helper function to manage session cookie
const manageSessionCookie = async (token: string | null) => {
  if (!isBrowser) return;

  try {
    if (token) {
      // Set session cookie
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        throw new Error('Failed to set session cookie');
      }
    } else {
      // Clear session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  } catch (error) {
    console.error('Error managing session cookie:', error);
  }
};

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('👤 User signed in:', user.email);
    // Get the ID token and set session cookie
    try {
      const token = await user.getIdToken();
      await manageSessionCookie(token);
    } catch (error) {
      console.error('Error getting ID token:', error);
    }
  } else {
    console.log('👋 User signed out');
    // Clear the session cookie
    await manageSessionCookie(null);
  }
});

// Sign in helper function
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out helper function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    await manageSessionCookie(null);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export default app;
