import {
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
  type AuthError as FirebaseAuthError,
  Auth,
} from 'firebase/auth';

import { getFirebaseServices } from '../config';

export interface AuthError {
  code: string;
  message: string;
  originalError?: unknown;
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

type AuthStateHandler = (authState: User | null) => void;

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const createAuthError = (
  code: string,
  message: string,
  originalError?: unknown
): AuthError => {
  return {
    code,
    message,
    originalError,
  };
};

let auth: Auth;

async function getAuth(): Promise<Auth> {
  if (!auth) {
    const services = await getFirebaseServices();
    auth = services.auth;
  }
  return auth;
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    if (!email || !password) {
      return {
        user: null,
        error: createAuthError('auth/invalid-input', 'Email and password are required'),
      };
    }

    if (!validateEmail(email)) {
      return {
        user: null,
        error: createAuthError('auth/invalid-email-format', 'Invalid email format'),
      };
    }

    if (!validatePassword(password)) {
      return {
        user: null,
        error: createAuthError(
          'auth/weak-password',
          'Password should be at least 6 characters'
        ),
      };
    }

    const authInstance = await getAuth();
    console.log('Attempting to sign in with email:', email);
    const userCredential = await firebaseSignInWithEmail(authInstance, email, password);
    console.log('Sign in successful:', userCredential.user.email);
    return {
      user: userCredential.user,
      error: null,
    };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    const firebaseError = error as FirebaseAuthError;
    return {
      user: null,
      error: createAuthError(
        firebaseError.code || 'auth/wrong-password',
        firebaseError.message || 'Invalid credentials',
        error
      ),
    };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    if (!email || !password) {
      return {
        user: null,
        error: createAuthError('auth/invalid-input', 'Email and password are required'),
      };
    }

    if (!validateEmail(email)) {
      return {
        user: null,
        error: createAuthError('auth/invalid-email-format', 'Invalid email format'),
      };
    }

    if (!validatePassword(password)) {
      return {
        user: null,
        error: createAuthError(
          'auth/weak-password',
          'Password should be at least 6 characters'
        ),
      };
    }

    const authInstance = await getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseAuthError;
    return {
      user: null,
      error: createAuthError(
        firebaseError.code || 'auth/unknown',
        firebaseError.message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const authInstance = await getAuth();
    await firebaseSignOut(authInstance);
    return { error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseAuthError;
    return {
      error: createAuthError(
        firebaseError.code || 'auth/network-error',
        firebaseError.message || 'Network error',
        error
      ),
    };
  }
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const authInstance = await getAuth();
    console.log('Starting Google sign in...');
    const userCredential = await signInWithPopup(authInstance, provider);
    console.log('Google sign in successful:', {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    });

    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    console.error('Google sign in error:', {
      error,
      code: error instanceof Error ? (error as FirebaseAuthError).code : 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const firebaseError = error as FirebaseAuthError;
    return {
      user: null,
      error: createAuthError(
        firebaseError.code || 'auth/unknown',
        firebaseError.message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  try {
    if (!email) {
      return {
        error: createAuthError('auth/invalid-input', 'Email is required'),
      };
    }

    if (!validateEmail(email)) {
      return {
        error: createAuthError('auth/invalid-email-format', 'Invalid email format'),
      };
    }

    const authInstance = await getAuth();
    await sendPasswordResetEmail(authInstance, email);
    return { error: null };
  } catch (error: unknown) {
    const firebaseError = error as FirebaseAuthError;
    return {
      error: createAuthError(
        firebaseError.code || 'auth/user-not-found',
        firebaseError.message || 'User not found',
        error
      ),
    };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const authInstance = await getAuth();
  return authInstance.currentUser;
};

export const subscribeToAuthChanges = async (
  handler: AuthStateHandler
): Promise<Unsubscribe> => {
  const authInstance = await getAuth();
  return onAuthStateChanged(authInstance, handler);
};
