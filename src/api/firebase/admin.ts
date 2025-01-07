import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('Firebase Admin initialization starting...');

// Initialize Firebase Admin if it hasn't been initialized yet
if (!getApps().length) {
  console.log('No existing Firebase Admin app found, initializing...');

  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  console.log('Using emulators:', useEmulators);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic';

  if (useEmulators) {
    console.log('Using Firebase Emulator configuration');
    initializeApp({
      projectId,
    });
  } else {
    console.log('Using production Firebase configuration');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required in production');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }
}

export const db = getFirestore();

// Connect to emulator if enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  const host = 'localhost';
  const port = 8080;
  console.log(`Connecting Firestore Admin to emulator at ${host}:${port}`);
  db.settings({
    host: `${host}:${port}`,
    ssl: false,
  });
}
