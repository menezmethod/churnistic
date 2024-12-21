'use client';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import type { Permission, UserRole } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOffline: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshClaims: () => Promise<void>;
}

// Extend the User type to include customClaims
declare module 'firebase/auth' {
  interface User {
    customClaims?: {
      role?: UserRole;
      permissions?: Permission[];
      isSuperAdmin?: boolean;
    };
  }
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get the ID token and set session cookie
        const token = await user.getIdTokenResult();
        setUser({ ...user, customClaims: token.claims as User['customClaims'] });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshClaims = async () => {
    if (!auth.currentUser) return;

    try {
      console.log('Refreshing claims for user:', auth.currentUser.email);

      // Force token refresh
      await auth.currentUser.getIdToken(true);
      // Get fresh token
      const token = await auth.currentUser.getIdToken();

      // Get session data from our API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      const { session } = await response.json();
      console.log('Session data:', session);

      // Get fresh user data
      const freshUser = auth.currentUser;
      if (freshUser) {
        // Update the user object with custom claims from session
        freshUser.customClaims = {
          role: session.role as UserRole,
          permissions:
            (session.permissions as Permission[]) ||
            ROLE_PERMISSIONS[session.role as UserRole],
          isSuperAdmin: session.isSuperAdmin as boolean,
        };

        console.log('Updated user object:', {
          email: freshUser.email,
          claims: freshUser.customClaims,
        });

        setUser({ ...freshUser });
      }
    } catch (error) {
      console.error('Error refreshing claims:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful, refreshing claims');
      await refreshClaims();
      console.log('Claims refreshed for user:', result.user.email);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Verify if user exists in MongoDB
      const verifyResponse = await fetch(`/api/users/verify/${result.user.uid}`);
      const isNewUser = !verifyResponse.ok;

      if (isNewUser) {
        console.log('Creating new user in MongoDB after Google sign in');
        // Create user in MongoDB if they don't exist
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || result.user.email?.split('@')[0],
            photoURL: result.user.photoURL,
          }),
        });

        if (!createResponse.ok) {
          // If MongoDB creation fails, delete the Firebase user to maintain consistency
          await result.user.delete();
          throw new Error('Failed to create user in database');
        }

        // Initialize Firebase custom claims for new user
        const initResponse = await fetch('/api/auth/initialize-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
          }),
        });

        if (!initResponse.ok) {
          console.error('Failed to initialize user claims');
          throw new Error('Failed to initialize user permissions');
        }

        const { token: customToken } = await initResponse.json();

        // Sign in with the custom token to get the new claims
        await signInWithCustomToken(auth, customToken);
      }

      // Force a token refresh to get the new claims
      await result.user.getIdToken(true);
      await refreshClaims();
      console.log('Google sign in successful for user:', result.user.email);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      // Create user in MongoDB
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.email?.split('@')[0],
        }),
      });

      if (!response.ok) {
        // If MongoDB creation fails, delete the Firebase user
        await userCredential.user.delete();
        throw new Error('Failed to create user in database');
      }

      // Initialize Firebase custom claims for new user
      const initResponse = await fetch('/api/auth/initialize-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        }),
      });

      if (!initResponse.ok) {
        console.error('Failed to initialize user claims');
        throw new Error('Failed to initialize user permissions');
      }

      const { token: customToken } = await initResponse.json();

      // Sign in with the custom token to get the new claims
      await signInWithCustomToken(auth, customToken);

      // Force a token refresh to get the new claims
      await userCredential.user.getIdToken(true);
      await refreshClaims();
      console.log('Sign up successful for user:', userCredential.user.email);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!auth.currentUser) return;

    try {
      // Update Firebase profile
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });

      // Update MongoDB profile
      const response = await fetch(`/api/users/${auth.currentUser.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          photoURL: photoURL || auth.currentUser.photoURL,
        }),
      });

      if (!response.ok) {
        // If MongoDB update fails, revert Firebase changes
        await updateProfile(auth.currentUser, {
          displayName: user?.displayName || '',
          photoURL: user?.photoURL || null,
        });
        throw new Error('Failed to update user in database');
      }

      // Force a refresh of the user object
      setUser({ ...auth.currentUser });
      console.log('Profile updated for user:', auth.currentUser.email);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user || !user.customClaims) {
      console.log('No user or custom claims found');
      return false;
    }

    const hasAdminAccess = user.customClaims.isSuperAdmin;
    const hasRoleAccess = user.customClaims.role === role;

    console.log('Checking role access:', {
      requiredRole: role,
      userRole: user.customClaims.role,
      isSuperAdmin: user.customClaims.isSuperAdmin,
      hasAccess: hasAdminAccess || hasRoleAccess,
    });

    return hasAdminAccess || hasRoleAccess;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.customClaims) {
      console.log('No user or custom claims found');
      return false;
    }

    // Super admins have all permissions
    if (user.customClaims.isSuperAdmin) {
      console.log('User is super admin, granting all permissions');
      return true;
    }

    // If permissions are missing, get them from the role
    const userPermissions =
      user.customClaims.permissions ||
      (user.customClaims.role ? ROLE_PERMISSIONS[user.customClaims.role] : []);

    const hasPermissionAccess = userPermissions?.includes(permission) ?? false;
    console.log('Checking permission access:', {
      requiredPermission: permission,
      userPermissions,
      hasAccess: hasPermissionAccess,
    });

    return hasPermissionAccess;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOffline,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
        updateUserProfile,
        hasRole,
        hasPermission,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
