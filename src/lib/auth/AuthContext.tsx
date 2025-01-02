'use client';

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
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Permission, UserRole } from '@/lib/auth/types';
import { ROLE_PERMISSIONS } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';

// Extend the User type to include customClaims
declare module 'firebase/auth' {
  interface User {
    customClaims?: {
      role?: UserRole;
      permissions?: Permission[];
    };
    role?: UserRole;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasRole: () => false,
  hasPermission: () => false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  resetPassword: async () => {},
  isOnline: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      // Start with loading state
      setLoading(true);

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!mounted) return;

        try {
          if (user) {
            // Force token refresh and get claims
            const idTokenResult = await user.getIdTokenResult(true);

            // Add claims to the user object without modifying the original
            Object.defineProperty(user, 'customClaims', {
              value: {
                role: idTokenResult.claims.role,
                permissions: idTokenResult.claims.permissions,
              },
              writable: true,
              configurable: true,
            });

            // Add role directly for easier access
            Object.defineProperty(user, 'role', {
              value: idTokenResult.claims.role,
              writable: true,
              configurable: true,
            });

            if (process.env.NODE_ENV === 'development') {
              console.log('User authenticated:', {
                email: user.email,
                role: user.role,
                claims: idTokenResult.claims,
              });
            }

            // Only try to manage session cookie if not in emulator
            if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR !== 'true') {
              await manageSessionCookie(user);
            }

            setUser(user);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error setting up auth:', error);
          // Don't set user to null on error, only on explicit sign out
        } finally {
          setLoading(false);
        }
      });
    };

    setupAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Online status monitoring
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

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Force token refresh and get claims
      await result.user.getIdToken(true);
      const idTokenResult = await result.user.getIdTokenResult(true);
      console.log('Sign in successful with claims:', {
        email: result.user.email,
        claims: idTokenResult.claims,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, []);

  const signInWithGithub = useCallback(async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Github sign in error:', error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      return user.customClaims?.role === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      const userRole = user.customClaims?.role as UserRole;
      if (!userRole) return false;
      return ROLE_PERMISSIONS[userRole].includes(permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      hasRole,
      hasPermission,
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
      loading,
      hasRole,
      hasPermission,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
