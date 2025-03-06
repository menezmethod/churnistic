import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { getAuth } from 'firebase/auth';

import { initializeFirebaseApp } from '@/lib/firebase/config';

/**
 * Initialize Firebase Auth
 * This follows the Firebase Next.js codelab pattern for auth initialization
 */
export async function initializeAuth() {
  const app = await initializeFirebaseApp();
  return getAuth(app);
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 * @returns A Promise that resolves with the user credentials
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = await initializeAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google
 * @returns A Promise that resolves with the user credentials
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = await initializeAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign in with GitHub
 * @returns A Promise that resolves with the user credentials
 */
export async function signInWithGitHub(): Promise<UserCredential> {
  const auth = await initializeAuth();
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Create a new user with email and password
 * @param email - User email
 * @param password - User password
 * @returns A Promise that resolves with the user credentials
 */
export async function createUser(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = await initializeAuth();
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Update user profile
 * @param user - Firebase user object
 * @param displayName - User display name
 * @param photoURL - User photo URL
 * @returns A Promise that resolves when the update is complete
 */
export async function updateUserProfile(
  user: User,
  displayName?: string | null,
  photoURL?: string | null
): Promise<void> {
  return updateProfile(user, { displayName, photoURL });
}

/**
 * Sign out the current user
 * @returns A Promise that resolves when the sign out is complete
 */
export async function signOut(): Promise<void> {
  const auth = await initializeAuth();
  return firebaseSignOut(auth);
}

/**
 * Send password reset email
 * @param email - User email
 * @returns A Promise that resolves when the email is sent
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = await initializeAuth();
  return sendPasswordResetEmail(auth, email);
}

/**
 * Reauthenticate user with credentials
 * @param user - Firebase user object
 * @param email - User email
 * @param password - User password
 * @returns A Promise that resolves with the user credentials
 */
export async function reauthenticateUser(
  user: User,
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = EmailAuthProvider.credential(email, password);
  return reauthenticateWithCredential(user, credential);
}

/**
 * Get the current auth instance
 * @returns A Promise that resolves with the auth instance
 */
export async function getFirebaseAuth() {
  return initializeAuth();
}

/**
 * Get the current user from the auth instance
 * @returns The current user or null if not signed in
 */
export async function getCurrentUser(): Promise<User | null> {
  const auth = await initializeAuth();
  return auth.currentUser;
}

/**
 * Create a session cookie on the server after authentication
 * @param idToken - Firebase ID token
 * @returns A Promise that resolves when the session is created
 */
export async function createSession(idToken: string): Promise<Response> {
  return fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });
}

/**
 * Get the current session from the server
 * @returns A Promise that resolves with the session data or null if no session
 */
export async function getSession(): Promise<SessionData | null> {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

/**
 * End the current session
 * @returns A Promise that resolves when the session is ended
 */
export async function endSession(): Promise<Response> {
  return fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'include', // Important for cookies
  });
}

// Session data interface
export interface SessionData {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: string;
  username?: string;
}
