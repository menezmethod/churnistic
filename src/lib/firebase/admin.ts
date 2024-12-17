import { initializeApp, getApps, cert } from 'firebase-admin/app';

interface FirebaseAdminError extends Error {
  code?: string;
}

const validateConfig = (): void => {
  const requiredFields = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const error = new Error(
      `Missing required Firebase Admin config: ${missingFields.join(', ')}`
    ) as FirebaseAdminError;
    error.code = 'admin/invalid-config';
    throw error;
  }
};

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

export function initAdmin(): void {
  try {
    validateConfig();

    if (getApps().length === 0) {
      const app = initializeApp({
        credential: cert(firebaseAdminConfig),
      });
      // eslint-disable-next-line no-console
      console.info('Firebase Admin initialized successfully:', app.name);
    } else {
      // eslint-disable-next-line no-console
      console.info('Firebase Admin already initialized');
    }
  } catch (error) {
    const adminError = error as FirebaseAdminError;
    // eslint-disable-next-line no-console
    console.error('Firebase Admin initialization failed:', {
      code: adminError.code,
      message: adminError.message,
    });
    throw adminError;
  }
}
