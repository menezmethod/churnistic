import { getApps, initializeApp, getApp } from 'firebase/app';
import {
  type User,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
  getAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

// In emulator mode, we can use any placeholder values
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Set auth persistence to browser local storage for persistence across refreshes
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

// Emulator connection should only happen in development
if (USE_EMULATOR) {
  try {
    console.log('🔧 Using Firebase Emulator Suite');

    // Connect to Auth Emulator
    console.log('🔑 Connecting to Auth Emulator at: localhost:9099');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

    // Connect to Firestore Emulator
    console.log('📚 Connecting to Firestore Emulator at: localhost:8080');
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Connect to Storage Emulator
    console.log('📦 Connecting to Storage Emulator at: localhost:9199');
    connectStorageEmulator(storage, 'localhost', 9199);

    // Connect to Functions Emulator
    console.log('⚡ Connecting to Functions Emulator at: localhost:5001');
    connectFunctionsEmulator(functions, 'localhost', 5001);

    console.log('🎉 Successfully connected to all emulators!');
  } catch (error) {
    console.error('❌ Error connecting to emulators:', error);
    throw error;
  }
}

// Session management
export async function manageSessionCookie(user: User) {
  try {
    console.log('Managing session cookie for user:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    // Get the ID token with force refresh
    const idToken = await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult(true);

    console.log('Got ID token and claims:', {
      hasToken: !!idToken,
      claims: {
        role: idTokenResult.claims.role,
        permissions: idTokenResult.claims.permissions,
      },
    });

    // Add claims to the user object
    Object.defineProperty(user, 'customClaims', {
      value: {
        role: idTokenResult.claims.role,
        permissions: idTokenResult.claims.permissions,
      },
      writable: true,
      configurable: true,
    });

    // Always use the session API, even in emulator mode
    console.log('Sending session cookie request to API');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      }),
      credentials: 'include', // Important for cookie handling
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Session API error:', errorData);
      throw new Error(`Failed to set session cookie: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Session cookie set successfully:', result);
    return result;
  } catch (error) {
    console.error('Error managing session:', error);
    throw error;
  }
}

// Initialize Firebase with auth state observer
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', {
      isSignedIn: !!user,
      userId: user?.uid,
      email: user?.email,
    });
  });
}

export const getAuthSettings = () => ({
  authDomain: [
    // Production
    'churnistic.com',
    'www.churnistic.com',
    // Vercel deployments
    'churnistic.vercel.app',
    'churnistic-*.vercel.app',
    'churnistic-*-menezmethods-projects.vercel.app',
    // Development
    'localhost',
  ],
});

// Determine if we should use emulators
const shouldUseEmulator = () => {
  const isVercelEnv = !!process.env.VERCEL_ENV;
  const isDevOrPreview =
    process.env.VERCEL_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' &&
    (!isVercelEnv || isDevOrPreview)
  );
};

// In your session cookie config, add production settings
const sessionCookieConfig = {
  name: 'session',
  maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
  httpOnly: true,
  secure: process.env.VERCEL_ENV !== 'development', // Secure in preview/production
  sameSite: 'lax' as 'none' | 'strict' | 'lax',
  path: '/',
};

export const getSessionCookieOptions = () => {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const useEmulator = shouldUseEmulator();

  const sameSite = useEmulator ? 'lax' : 'none';

  return {
    ...sessionCookieConfig,
    domain: isProduction ? '.churnistic.com' : undefined,
    secure: (isProduction || isPreview) && !useEmulator,
    sameSite: sameSite as 'none' | 'strict' | 'lax',
  };
};

export { auth, db, storage, functions };
