import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
  type AuthError as FirebaseAuthError,
} from 'firebase/auth';

import { auth } from '../auth/firebase';

export interface AuthError {
  code: string;
  message: string;
  originalError?: FirebaseAuthError;
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

const createAuthError = (code: string, message: string, originalError?: unknown): AuthError => {
  return {
    code,
    message,
    originalError: originalError as FirebaseAuthError,
  };
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Input validation
  if (!email || !password) {
    return {
      user: null,
      error: createAuthError(
        'auth/invalid-input',
        'Email and password are required'
      ),
    };
  }

  if (!validateEmail(email)) {
    return {
      user: null,
      error: createAuthError(
        'auth/invalid-email-format',
        'Invalid email format'
      ),
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

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Input validation
  if (!email || !password) {
    return {
      user: null,
      error: createAuthError(
        'auth/invalid-input',
        'Email and password are required'
      ),
    };
  }

  if (!validateEmail(email)) {
    return {
      user: null,
      error: createAuthError(
        'auth/invalid-email-format',
        'Invalid email format'
      ),
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

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return {
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const signInWithGithub = async (): Promise<AuthResponse> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return {
      user: null,
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  if (!email) {
    return {
      error: createAuthError(
        'auth/invalid-input',
        'Email is required'
      ),
    };
  }

  if (!validateEmail(email)) {
    return {
      error: createAuthError(
        'auth/invalid-email-format',
        'Invalid email format'
      ),
    };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return {
      error: createAuthError(
        (error as FirebaseAuthError).code || 'auth/unknown',
        (error as FirebaseAuthError).message || 'An unknown error occurred',
        error
      ),
    };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: AuthStateHandler): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};
