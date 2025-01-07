import { getApps, initializeApp } from 'firebase/app';
import {
  type User,
  connectAuthEmulator,
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

// In emulator mode, we can use any placeholder values
export const firebaseConfig = {
  apiKey: USE_EMULATOR ? 'fake-api-key' : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: USE_EMULATOR ? 'localhost' : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: USE_EMULATOR ? 'demo-local' : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: USE_EMULATOR
    ? 'demo-local'
    : process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: USE_EMULATOR
    ? '000000000000'
    : process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: USE_EMULATOR
    ? '1:000000000000:web:0000000000000000000000'
    : process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase - ensure single instance
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if enabled
if (USE_EMULATOR) {
  try {
    console.log('🔧 Using Firebase Emulator Suite');

    // Set auth persistence to browser local storage for persistence across refreshes
    setPersistence(auth, browserLocalPersistence);

    // Connect to Auth Emulator
    console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

    // Connect to Firestore Emulator
    console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Connect to Storage Emulator
    console.log('📦 Connecting to Storage Emulator at: localhost:9199');
    connectStorageEmulator(storage, 'localhost', 9199);

    // Connect to Functions Emulator
    console.log('⚡ Connecting to Functions Emulator at: localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);

    console.log('🎉 Successfully connected to all emulators!');
  } catch (error) {
    console.error('❌ Error connecting to emulators:', error);
    throw error;
  }
}

// Session management
export async function manageSessionCookie(user: User) {
  try {
    // Get the ID token with force refresh
    const idToken = await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult(true);

    // Add claims to the user object
    Object.defineProperty(user, 'customClaims', {
      value: {
        role: idTokenResult.claims.role,
        permissions: idTokenResult.claims.permissions,
      },
      writable: true,
      configurable: true,
    });

    // Set session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to set session cookie');
    }

    // Set a local cookie for the emulator environment
    if (USE_EMULATOR) {
      document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Strict`;
    }
  } catch (error) {
    console.error('Error managing session:', error);
    throw error;
  }
}
