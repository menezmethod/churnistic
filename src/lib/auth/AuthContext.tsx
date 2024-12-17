'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase/auth';
import type { AuthUser, Permission } from '@/types/auth';
import { ROLE_PERMISSIONS, UserRole, UserRole as DefaultRole } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidRole = (role: unknown): role is UserRole =>
  typeof role === 'string' && role in UserRole;

const getPermissionsForRole = (role: UserRole): Permission[] => {
  switch (role) {
    case UserRole.ADMIN:
      return ROLE_PERMISSIONS.admin;
    case UserRole.SUPPORT:
      return ROLE_PERMISSIONS.support;
    case UserRole.USER:
    default:
      return ROLE_PERMISSIONS.user;
  }
};

const getUserFromFirebase = async (firebaseUser: User): Promise<AuthUser> => {
  const token = await firebaseUser.getIdTokenResult();
  const claimedRole = token.claims.role;
  const role = isValidRole(claimedRole) ? claimedRole : DefaultRole.USER;
  const permissions = getPermissionsForRole(role);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role,
    permissions,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthStateChanged = async (firebaseUser: User | null): Promise<void> => {
      if (firebaseUser) {
        const user = await getUserFromFirebase(firebaseUser);
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void handleAuthStateChanged(firebaseUser);
    });

    return unsubscribe;
  }, []);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) {
      return false;
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
