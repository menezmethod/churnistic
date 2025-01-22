import {
  getFirestore as getClientFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

import { app } from './app';

let firestoreInstance: ReturnType<typeof getClientFirestore>;

export function getFirestore() {
  if (!firestoreInstance) {
    firestoreInstance = getClientFirestore(app);

    // Connect to emulator if enabled
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectFirestoreEmulator(firestoreInstance, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      } catch (error) {
        console.error('Failed to connect to Firestore emulator:', error);
      }
    }
  }

  return firestoreInstance;
}
