import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage';

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

// Connect to emulators if enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Using Firebase Emulator Suite');
  console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('📦 Connecting to Storage Emulator at: localhost:9199');
  connectStorageEmulator(storage, 'localhost', 9199);
}

interface FirebaseContext {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let firebaseApp: FirebaseContext | undefined;

export function initializeFirebase(): FirebaseContext {
  if (firebaseApp) {
    return firebaseApp;
  }

  const apps = getApps();
  if (!apps.length) {
    console.log('🔧 Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
    });

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      console.log('🔧 Connecting to Firebase emulators');
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
    }

    firebaseApp = { app, auth, db, storage };
    return firebaseApp;
  }

  const app = apps[0];
  firebaseApp = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return firebaseApp;
}

export function getFirebaseApp(): FirebaseContext {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
}

interface SessionResponse {
  status?: string;
  error?: string;
  details?: string;
  stack?: string;
  customClaims?: {
    role: string;
    permissions: string[];
    isSuperAdmin: boolean;
  };
}

async function makeRequest(url: string, options: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      console.error('Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        errorData,
        headers: Object.fromEntries(response.headers.entries()),
      });
      throw new Error(
        isJson && typeof errorData === 'object' && 'details' in errorData
          ? String(errorData.details)
          : `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    console.error('Network request failed:', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function manageSessionCookie(user: any) {
  if (user) {
    try {
      console.log('Starting session creation for user:', {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified
      });

      const idToken = await user.getIdToken(true);
      console.log('ID token obtained successfully:', {
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 10) + '...'
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
        headers: Object.fromEntries(response.headers.entries())
      });

      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      let responseData;
      try {
        const text = await response.text();
        console.log('Raw response text:', text);
        
        try {
          responseData = text ? JSON.parse(text) : {};
          console.log('Parsed response data:', responseData);
        } catch (parseError) {
          console.log('Failed to parse response as JSON:', text);
          responseData = text;
        }
      } catch (readError) {
        console.error('Error reading response:', readError);
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
        
        const errorMessage = typeof responseData === 'object' && responseData?.error
          ? responseData.error
          : typeof responseData === 'string' && responseData
            ? responseData
            : `Session creation failed with status ${response.status}`;

        throw new Error(errorMessage);
      }

      console.log('Session created successfully:', responseData);
    } catch (error) {
      console.error('Session management error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
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
          error: errorData
        });
        throw new Error('Failed to delete session');
      }

      console.log('Session deleted successfully');
    } catch (error) {
      console.error('Session deletion error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
