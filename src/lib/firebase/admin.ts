import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Set the emulator host explicitly
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// The Admin SDK automatically connects to the emulator when FIREBASE_AUTH_EMULATOR_HOST is set
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
console.log('🔧 Using emulators:', useEmulators);
console.log('🔧 Auth emulator host:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
console.log('🔧 Firestore emulator host:', process.env.FIRESTORE_EMULATOR_HOST);

if (!getApps().length) {
  if (useEmulators) {
    // In emulator mode, we don't need credentials
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
    });
  } else {
    // In production, we need proper credentials
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

const auth = getAuth();
const db = getFirestore();

export { auth, db };
