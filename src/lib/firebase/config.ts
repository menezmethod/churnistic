import { getApps, initializeApp } from 'firebase/app';
import {
  type User,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
  browserSessionPersistence,
  initializeAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

// In emulator mode, we can use any placeholder values
export const firebaseConfig = {
  apiKey: USE_EMULATOR ? 'fake-api-key' : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: USE_EMULATOR ? 'localhost' : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: USE_EMULATOR
    ? 'demo-churnistic-local'
    : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: USE_EMULATOR
    ? 'demo-churnistic-local'
    : process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: USE_EMULATOR
    ? '000000000000'
    : process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: USE_EMULATOR
    ? '1:000000000000:web:0000000000000000000000'
    : process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - ensure single instance
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if enabled
if (USE_EMULATOR) {
  try {
    console.log('🔧 Using Firebase Emulator Suite');

    // Set auth persistence to browser local storage for persistence across refreshes
    setPersistence(auth, browserLocalPersistence);

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
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Session API error:', errorData);
      throw new Error(`Failed to set session cookie: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Session cookie set successfully:', result);
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

// In your session cookie config, add production settings
const sessionCookieConfig = {
  name: 'session',
  maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Critical for Vercel
  sameSite: 'lax' as const,
  path: '/',
  // Add domain if using custom domain
  // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
};

export const getSessionCookieOptions = () => ({
  ...sessionCookieConfig,
  // Vercel-specific domain configuration
  domain:
    process.env.VERCEL_ENV === 'production'
      ? '.churnistic.com' // Your production domain
      : process.env.VERCEL_URL
        ? `.${process.env.VERCEL_URL}` // Automatic Vercel preview domains
        : 'localhost',
});
