import { getApps, initializeApp } from 'firebase/app';
import { type User, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Auth
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔧 Using Firebase Emulator Suite');
  console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
  connectAuthEmulator(auth, 'http://localhost:9099');
  console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('📦 Connecting to Storage Emulator at: localhost:9199');
  connectStorageEmulator(storage, 'localhost', 9199);
  console.log('⚡ Connecting to Functions Emulator at: localhost:5001');
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Session management
export async function manageSessionCookie(user: User) {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    console.log('Using emulator - skipping session cookie management');
    return;
  }

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
  } catch (error) {
    console.error('Error managing session:', error);
  }
}
