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

import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export type AuthUser = User & {
  customClaims?: {
    role?: string;
    permissions?: string[];
  };
  role?: string;
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
            authUser.customClaims = {
              role: idTokenResult.claims.role,
              permissions: idTokenResult.claims.permissions,
            };
            authUser.role = idTokenResult.claims.role;

            // Manage session cookie
            if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR !== 'true') {
              await manageSessionCookie(user);
            }

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
  const { user } = await signInWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password
  );
  await user.getIdToken(true);
  return user as AuthUser;
};

// Register with email/password
export const registerWithEmail = async (
  credentials: RegisterCredentials
): Promise<AuthUser> => {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password
  );
  await handleUserProfile(user);
  return user as AuthUser;
};

// Login with Google
export const loginWithGoogle = async (): Promise<AuthUser> => {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await handleUserProfile(user);
  return user as AuthUser;
};

// Login with GitHub
export const loginWithGithub = async (): Promise<AuthUser> => {
  const provider = new GithubAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  await handleUserProfile(user);
  return user as AuthUser;
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Logout
export const logout = async (): Promise<void> => {
  await firebaseSignOut(auth);
};
