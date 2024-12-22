import { initializeApp, getApps, cert } from 'firebase-admin/app';

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export const firebaseAdmin =
  getApps().length === 0
    ? initializeApp(
        useEmulators
          ? {
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            }
          : {
              credential: cert(
                JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
              ),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            }
      )
    : getApps()[0];
