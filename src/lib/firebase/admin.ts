// IMPORTANT: Environment variables must be set before any firebase imports
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
});

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  console.log('🔧 Setting up Firebase emulators:', {
    firestore: process.env.FIRESTORE_EMULATOR_HOST,
    auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
  });
}

import { getAdminApp, getAdminAuth, getAdminDb } from './admin-app';

console.log('🔄 Initializing Firebase Admin SDK...');

// Initialize in order
const app = getAdminApp();
const auth = getAdminAuth();
const db = getAdminDb();

export { app, auth, db };
