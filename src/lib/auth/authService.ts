import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { UserRole } from '@/lib/auth/types';
import { getFirebaseServices } from '@/lib/firebase/config';
import { manageSessionCookie } from '@/lib/firebase/utils/session';
import { UserProfile } from '@/types/user';

export type AuthUser = User & {
  customClaims?: {
    role?: string;
    permissions?: string[];
    isSuperAdmin?: boolean;
  };
  role?: string;
  isSuperAdmin?: boolean;
  username?: string;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string;
}

// Function to handle user profile creation/update
async function handleUserProfile(user: User): Promise<void> {
  const { firestore } = await getFirebaseServices();
  const userRef = doc(firestore, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newProfile: UserProfile = {
      id: user.uid,
      role: 'user',
      email: user.email || '',
      status: 'active',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      customDisplayName: user.displayName || user.email?.split('@')[0] || '',
      photoURL: user.photoURL || '',
      firebaseUid: user.uid,
      creditScore: null,
      monthlyIncome: null,
      businessVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      householdId: null,
    };
    await setDoc(userRef, newProfile);
  }
}

// Function to check if a user is a super admin
export const isSuperAdmin = (user: AuthUser | null): boolean => {
  if (!user || !user.email) return false;
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  return superAdminEmail
    ? user.email.toLowerCase() === superAdminEmail.toLowerCase()
    : false;
};

// Get the currently logged-in user
export const loadUser = async (): Promise<AuthUser | null> => {
  console.log('[authService] loadUser started');
  const { auth } = await getFirebaseServices();
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseOnAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            console.log('[authService] loadUser - user detected:', user.email);
            // Force token refresh and get claims
            const idTokenResult = await user.getIdTokenResult(true);
            const authUser = user as AuthUser;

            // Add claims to the user object
            authUser.customClaims = {
              role: idTokenResult.claims.role as string | undefined,
              permissions: idTokenResult.claims.permissions as string[] | undefined,
              isSuperAdmin: isSuperAdmin(authUser),
            };
            authUser.role = idTokenResult.claims.role as string | undefined;
            authUser.isSuperAdmin = isSuperAdmin(authUser);

            // Manage session cookie
            await manageSessionCookie(user);

            resolve(authUser);
          } catch (error) {
            console.error('[authService] loadUser - error:', error);
            reject(error);
          }
        } else {
          console.log('[authService] loadUser - no user detected');
          resolve(null);
        }
      },
      reject
    );
  });
};

// Login with email/password
export const loginWithEmail = async (
  credentials: LoginCredentials
): Promise<AuthUser> => {
  try {
    const { auth } = await getFirebaseServices();
    const { user } = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    await user.getIdToken(true);
    await manageSessionCookie(user);
    return user as AuthUser;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register with email/password
export const registerWithEmail = async (
  credentials: RegisterCredentials
): Promise<AuthUser> => {
  try {
    const { auth } = await getFirebaseServices();
    const { user } = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    await handleUserProfile(user);
    await manageSessionCookie(user);
    return user as AuthUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<AuthUser> => {
  try {
    const { auth } = await getFirebaseServices();
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());

    // Force token refresh and get session cookie
    const idToken = await user.getIdToken(true);
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });

    if (!sessionResponse.ok) {
      throw new Error(`Session creation failed: ${await sessionResponse.text()}`);
    }

    const sessionData = await sessionResponse.json(); // Parse response body
    console.log('[authService] Session API response:', sessionData); // Log response data

    // Verify session through backend
    const sessionCheck = await fetch('/api/auth/session', {
      credentials: 'include',
    });
    if (!sessionCheck.ok) {
      throw new Error('Session verification failed');
    }

    await handleUserProfile(user);
    return user as AuthUser;
  } catch (error) {
    console.error('Google login error:', error);
    throw new Error('Failed to complete Google login');
  }
};

// Login with GitHub
export const loginWithGithub = async (): Promise<AuthUser> => {
  try {
    const { auth } = await getFirebaseServices();
    const provider = new GithubAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await handleUserProfile(user);
    await manageSessionCookie(user);
    return user as AuthUser;
  } catch (error) {
    console.error('GitHub login error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  const { auth } = await getFirebaseServices();
  await sendPasswordResetEmail(auth, email);
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    const { auth } = await getFirebaseServices();
    await firebaseSignOut(auth);
    // Clear session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Example role check implementation
export const hasRole = async (role: UserRole): Promise<boolean> => {
  const user = (await getCurrentUser()) as AuthUser | null;
  if (!user) return false;

  // Check both custom claims and direct role property
  const userRole = user.customClaims?.role || user.role;
  return userRole === role;
};

export const getCurrentUser = async () => {
  const { auth } = await getFirebaseServices();
  return auth.currentUser;
};

export const onAuthStateChanged = async (callback: (user: User | null) => void) => {
  const { auth } = await getFirebaseServices();
  return firebaseOnAuthStateChanged(auth, callback);
};
