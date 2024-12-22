'use client';

import { type User, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { signOut } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';

import { Permission, UserRole } from './types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  signOut: () => Promise<void>;
  signUp?: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOnline: true,
  hasRole: () => false,
  hasPermission: () => false,
  signOut: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
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

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user?.customClaims) {
        return false;
      }

      const hasAdminAccess = user.customClaims.isSuperAdmin;
      const hasRoleAccess = user.customClaims.role === role;

      return Boolean(hasAdminAccess || hasRoleAccess);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user?.customClaims) {
        return false;
      }

      // Super admins have all permissions
      if (user.customClaims.isSuperAdmin) {
        return true;
      }

      // If permissions are missing, get them from the role
      const userPermissions = user.customClaims.permissions || [];

      return userPermissions.includes(permission);
    },
    [user]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await manageSessionCookie(user);
          setUser(user);
        } catch (error) {
          console.error('Error managing session:', error);
          setUser(null);
        }
      } else {
        try {
          await manageSessionCookie(null);
          setUser(null);
        } catch (error) {
          console.error('Error clearing session:', error);
        }
      }
      setLoading(false);
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOffline, handleOnline]);

  const value = {
    user,
    loading,
    isOnline,
    hasRole,
    hasPermission,
    signOut: async () => {
      await signOut();
      router.push('/signin');
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export { UserRole };

