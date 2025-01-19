import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';

import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';

import {
  type AuthUser,
  type LoginCredentials,
  type RegisterCredentials,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from './types';

export type { AuthUser, LoginCredentials, RegisterCredentials };

// Function to handle user profile creation/update
async function handleUserProfile(user: AuthUser): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const isSuperAdmin = user.email === 'menezfd@gmail.com';
    const role = isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER;

    // Set custom claims using admin auth
    await getAuth().setCustomUserClaims(user.uid, {
      role,
      permissions: ROLE_PERMISSIONS[role],
    });

    const newProfile = {
      id: user.uid,
      role,
      email: user.email || '',
      status: 'active',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      customDisplayName: user.displayName || user.email?.split('@')[0] || '',
      photoURL: user.photoURL || '',
      firebaseUid: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, newProfile);
  }
}

// Get the currently logged-in user
export const loadUser = async (): Promise<AuthUser | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            // Force token refresh and get claims
            const idTokenResult = await user.getIdTokenResult(true);
            const authUser = user as AuthUser;

            // Add claims to the user object
            const permissions =
              (idTokenResult.claims.permissions as string[])?.map(
                (p) => p as Permission
              ) || [];
            authUser.customClaims = {
              role: idTokenResult.claims.role as UserRole,
              permissions,
            };
            authUser.role = idTokenResult.claims.role as UserRole;

            // Manage session cookie
            await manageSessionCookie(user);

            resolve(authUser);
          } catch (error) {
            reject(error);
          }
        } else {
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
    const { user } = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    await handleUserProfile(user as AuthUser);
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
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await handleUserProfile(user as AuthUser);
    await manageSessionCookie(user);
    return user as AuthUser;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

// Login with GitHub
export const loginWithGithub = async (): Promise<AuthUser> => {
  try {
    const provider = new GithubAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await handleUserProfile(user as AuthUser);
    await manageSessionCookie(user);
    return user as AuthUser;
  } catch (error) {
    console.error('GitHub login error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    // Clear session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
