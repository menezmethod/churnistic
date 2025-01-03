import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error(
    'Missing required Firebase configuration. Check your environment variables.'
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Connect to emulator if enabled (respecting existing emulator config)
if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' &&
  process.env.FIREBASE_FIRESTORE_EMULATOR_HOST
) {
  const [host, port] = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, parseInt(port, 10));
}

export { db };
