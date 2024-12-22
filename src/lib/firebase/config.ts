import { getApps, initializeApp } from 'firebase/app';
import { type User, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { type FirebaseError } from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Auth
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Using Firebase Emulator Suite');
  console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('📦 Connecting to Storage Emulator at: localhost:9199');
  connectStorageEmulator(storage, 'localhost', 9199);
  console.log('⚡ Connecting to Functions Emulator at: localhost:5001');
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export async function manageSessionCookie(user: User | null): Promise<void> {
  if (user) {
    try {
      console.log('Starting session creation for user:', {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
      });

      const idToken = await user.getIdToken(true);
      console.log('ID token obtained successfully:', {
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 10) + '...',
      });

      console.log('Sending request to session API...');
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      console.log('Session API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      let responseData;
      try {
        const text = await response.text();
        console.log('Raw response text:', text);

        responseData = text ? JSON.parse(text) : {};
        console.log('Parsed response data:', responseData);
      } catch (error) {
        console.error('Error reading response:', error);
        responseData = null;
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          contentType,
          responseData,
          headers: Object.fromEntries(response.headers.entries()),
        };
        console.error('Session creation failed:', errorDetails);

        const errorMessage =
          typeof responseData === 'object' && responseData?.error
            ? responseData.error
            : typeof responseData === 'string' && responseData
              ? responseData
              : `Session creation failed with status ${response.status}`;

        throw new Error(errorMessage);
      }

      console.log('Session created successfully:', responseData);
    } catch (error) {
      const sessionError = error as FirebaseError;
      console.error('Session management error:', {
        name: sessionError.name,
        message: sessionError.message,
        stack: sessionError.stack,
        cause: sessionError.cause,
      });
      throw error;
    }
  } else {
    try {
      console.log('Attempting to delete session...');
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Session deletion failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error('Failed to delete session');
      }

      console.log('Session deleted successfully');
    } catch (error) {
      const deleteError = error as Error;
      console.error('Session deletion error:', {
        name: deleteError.name,
        message: deleteError.message,
        stack: deleteError.stack,
      });
      throw error;
    }
  }
}
