'use client';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase/config';
import { Permission, UserRole } from './types';

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
          permissions: (session.permissions as Permission[]) || [],
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

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        'Auth state changed:',
        user ? `User logged in: ${user.email}` : 'No user'
      );

      if (user) {
        try {
          // Force token refresh to get latest claims
          await user.getIdToken(true);
          // Get fresh token
          const token = await user.getIdToken();

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

          // Update the user object with custom claims from session
          user.customClaims = {
            role: session.role as UserRole,
            permissions: (session.permissions as Permission[]) || [],
            isSuperAdmin: session.isSuperAdmin as boolean,
          };

          console.log('Updated user object:', {
            email: user.email,
            claims: user.customClaims,
          });
        } catch (error) {
          console.error('Error getting user claims:', error);
        }
      }

      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
      await refreshClaims();
      console.log('Google sign in successful for user:', result.user.email);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
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
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });
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
    
    const hasPermissionAccess = user.customClaims.permissions?.includes(permission) ?? false;
    console.log('Checking permission access:', {
      requiredPermission: permission,
      userPermissions: user.customClaims.permissions,
      hasAccess: hasPermissionAccess,
    });
    
    return hasPermissionAccess;
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
