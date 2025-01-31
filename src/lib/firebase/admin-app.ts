// IMPORTANT: Environment variables must be set before any firebase imports
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
});

// Set up all emulators if needed
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.STORAGE_EMULATOR_HOST = 'http://localhost:9199';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'http://localhost:9199';
  process.env.FIREBASE_STORAGE_BASE_URL = 'http://localhost:9199/v0';
}

import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin once
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
      ...(process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'true' && {
        credential: cert(
          JSON.parse(
            Buffer.from(
              process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
              'base64'
            ).toString('utf-8')
          )
        ),
      }),
    });

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export const getAdminAuth = () => auth;
export const getAdminDb = () => db;
export const getAdminApp = () => app;

export type { App, Auth, Firestore };
