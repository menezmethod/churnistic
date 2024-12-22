'use client';

import { User, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';

import { auth } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { signOut } from '@/lib/firebase/auth';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum Permission {
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  VIEW_ADMIN = 'view_admin',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_ADMIN,
  ],
  [UserRole.USER]: [],
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOnline: true,
  hasRole: () => false,
  hasPermission: () => false,
  signOut: async () => {},
});

export function useAuth() {
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

export function AuthProvider({ children }: AuthProviderProps) {
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

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user || !user.customClaims) {
      return false;
    }

    const hasAdminAccess = user.customClaims.isSuperAdmin;
    const hasRoleAccess = user.customClaims.role === role;

    return hasAdminAccess || hasRoleAccess;
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user || !user.customClaims) {
      return false;
    }

    // Super admins have all permissions
    if (user.customClaims.isSuperAdmin) {
      return true;
    }

    // If permissions are missing, get them from the role
    const userPermissions =
      user.customClaims.permissions ||
      (user.customClaims.role ? ROLE_PERMISSIONS[user.customClaims.role] : []);

    return userPermissions?.includes(permission) ?? false;
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            // Get the ID token result to get custom claims
            const idTokenResult = await user.getIdTokenResult();
            // Add custom claims to the user object
            user.customClaims = {
              role: idTokenResult.claims.role as UserRole,
              permissions: idTokenResult.claims.permissions as Permission[],
              isSuperAdmin: idTokenResult.claims.isSuperAdmin as boolean,
            };
            await manageSessionCookie(user);
            setUser(user);
          } else {
            await manageSessionCookie(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribe();
      };
    }
  }, [handleOnline, handleOffline, router]);

  return (
    <AuthContext.Provider value={{ user, loading, isOnline, hasRole, hasPermission, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
