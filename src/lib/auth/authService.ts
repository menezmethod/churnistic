import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { UserRole } from '@/lib/auth/types';
import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export type AuthUser = User & {
  customClaims?: {
    role?: string;
    permissions?: string[];
    isSuperAdmin?: boolean;
  };
  role?: string;
  isSuperAdmin?: boolean;
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
  const userRef = doc(db, 'users', user.uid);
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

  // Check if user's email matches the super admin email
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const isEmailMatch = superAdminEmail
    ? user.email.toLowerCase() === superAdminEmail.toLowerCase()
    : false;

  // Check if user has SUPERADMIN role in custom claims or direct role
  const hasSuperAdminRole =
    user.customClaims?.role === UserRole.SUPERADMIN || user.role === UserRole.SUPERADMIN;

  // Check if user has super admin flag in custom claims
  const hasCustomClaimFlag = user.customClaims?.isSuperAdmin === true;

  return isEmailMatch || hasSuperAdminRole || hasCustomClaimFlag;
};

// Get the currently logged-in user
export const loadUser = async (): Promise<AuthUser | null> => {
  return new Promise((resolve, reject) => {
    console.log('Starting loadUser');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            console.log('User found in auth state, refreshing token');
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

            console.log('User loaded with claims:', {
              uid: authUser.uid,
              email: authUser.email,
              role: authUser.customClaims.role,
              isSuperAdmin: authUser.customClaims.isSuperAdmin,
            });

            // Manage session cookie
            await manageSessionCookie(user);

            resolve(authUser);
          } catch (error) {
            console.error('Error loading user:', error);
            reject(error);
          }
        } else {
          console.log('No user found in auth state');
          resolve(null);
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        reject(error);
      }
    );
  });
};

// Login with email/password
export const loginWithEmail = async (
  credentials: LoginCredentials
): Promise<AuthUser> => {
  try {
    console.log('Starting email login process');
    const { user } = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    console.log('Firebase auth successful, getting ID token');

    // Force token refresh
    const idToken = await user.getIdToken(true);
    console.log('Got fresh ID token:', idToken.substring(0, 10) + '...');

    // Set session cookie
    console.log('Setting session cookie');
    await manageSessionCookie(user);
    console.log('Session cookie set');

    // Get fresh claims
    const idTokenResult = await user.getIdTokenResult(true);
    const authUser = user as AuthUser;
    authUser.customClaims = {
      role: idTokenResult.claims.role as string | undefined,
      permissions: idTokenResult.claims.permissions as string[] | undefined,
      isSuperAdmin: isSuperAdmin(authUser),
    };

    console.log('Login complete with claims:', {
      role: authUser.customClaims.role,
      isSuperAdmin: authUser.customClaims.isSuperAdmin,
    });

    return authUser;
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
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await handleUserProfile(user);
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

// Example role check implementation
export const hasRole = (role: UserRole): boolean => {
  const user = auth.currentUser as AuthUser | null;
  if (!user) return false;

  // Check both custom claims and direct role property
  const userRole = user.customClaims?.role || user.role;
  return userRole === role;
};
