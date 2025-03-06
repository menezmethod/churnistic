'use client';

import { useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';

import { Permission, UserRole } from '@/lib/auth/types';
import { ROLE_PERMISSIONS } from '@/lib/auth/types';

import type { AuthUser } from './authService';
import * as firebaseAuth from './firebase-auth';

// Enhanced AuthContextType following Firebase codelab patterns
interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isSuperAdmin: () => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isOnline: boolean;
}

// Creating the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  isAdmin: false,
  hasRole: () => false,
  hasPermission: () => false,
  isSuperAdmin: () => false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  resetPassword: async () => {},
  isOnline: true,
});

/**
 * Auth provider component that handles authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Firebase auth and listen for auth state changes
  useEffect(() => {
    const initAuth = async () => {
      const auth = await firebaseAuth.getFirebaseAuth();

      return onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);

        try {
          if (firebaseUser) {
            setFirebaseUser(firebaseUser);

            // Get session from the server
            const sessionData = await firebaseAuth.getSession();

            if (sessionData) {
              // Set user data from the session
              setUser({
                ...firebaseUser,
                uid: sessionData.uid,
                email: sessionData.email,
                emailVerified: sessionData.emailVerified,
                role: sessionData.role || 'user',
                username: sessionData.username,
              } as AuthUser);
            } else {
              // If there's a Firebase user but no session, create one
              const idToken = await firebaseUser.getIdToken();
              const response = await firebaseAuth.createSession(idToken);

              if (response.ok) {
                const sessionData = await response.json();
                setUser({
                  ...firebaseUser,
                  uid: sessionData.uid,
                  email: sessionData.email,
                  emailVerified: sessionData.emailVerified,
                  role: sessionData.role || 'user',
                  username: sessionData.username,
                } as AuthUser);
              } else {
                // Failed to create session
                console.error('Failed to create session');
                setUser(null);
              }
            }
          } else {
            // No Firebase user, clear user data
            setFirebaseUser(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
          setFirebaseUser(null);
        } finally {
          setLoading(false);
        }
      });
    };

    const unsubscribe = initAuth();
    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, []);

  // Define auth functions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await firebaseAuth.signInWithEmail(email, password);
      // Session will be created in the auth state change listener
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await firebaseAuth.createUser(email, password);
      // Session will be created in the auth state change listener
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await firebaseAuth.endSession();
      await firebaseAuth.signOut();
      queryClient.clear();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [queryClient, router]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await firebaseAuth.signInWithGoogle();
      // Session will be created in the auth state change listener
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGithub = useCallback(async () => {
    try {
      setLoading(true);
      await firebaseAuth.signInWithGitHub();
      // Session will be created in the auth state change listener
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      await firebaseAuth.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Role and permission checks
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return (
        user?.role === role || user?.role === 'admin' || user?.role === 'super_admin'
      );
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;

      // Get permissions for the user's role
      const rolePermissions = ROLE_PERMISSIONS[(user.role || 'user') as UserRole] || [];

      // Super admins and admins have all permissions
      return (
        user.role === 'super_admin' ||
        user.role === 'admin' ||
        rolePermissions.includes(permission)
      );
    },
    [user]
  );

  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin';
  }, [user]);

  // Create the auth context value
  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      isAdmin,
      hasRole,
      hasPermission,
      isSuperAdmin,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithGithub,
      resetPassword,
      isOnline,
    }),
    [
      user,
      firebaseUser,
      loading,
      isAdmin,
      hasRole,
      hasPermission,
      isSuperAdmin,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithGithub,
      resetPassword,
      isOnline,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
