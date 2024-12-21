import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// The Admin SDK automatically connects to the emulator when FIREBASE_AUTH_EMULATOR_HOST is set
const useEmulators = process.env.FIREBASE_AUTH_EMULATOR_HOST != null;
console.log('🔧 Using emulators:', useEmulators);

if (!getApps().length) {
  // In emulator mode, we don't need credentials
  initializeApp({
    projectId: 'demo-churnistic'
  });
}

const auth = getAuth();
const db = getFirestore();

export { auth, db };
