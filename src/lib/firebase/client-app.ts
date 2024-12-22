import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';

import { initializeFirebase } from './config';

const { auth, db, storage } = initializeFirebase();

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Using Firebase Emulator Suite');
  console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
  console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
  console.log('📦 Connecting to Storage Emulator at: localhost:9199');
}

export { auth, db, storage };
export type { Auth, Firestore, FirebaseStorage };
