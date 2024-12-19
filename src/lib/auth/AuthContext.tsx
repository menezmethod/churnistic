'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase/auth';

import type { AuthContextType, AuthUser, Permission } from './types';
import { ROLE_PERMISSIONS, UserRole } from './types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasRole: () => false,
  hasPermission: () => false,
});

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect((): (() => void) => {
    let unsubscribe: () => void;

    const setupAuth = async (): Promise<void> => {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser): void => {
        void (async (): Promise<void> => {
          if (firebaseUser) {
            try {
              const tokenResult = await firebaseUser.getIdTokenResult();
              const role = (tokenResult.claims.role as UserRole) || UserRole.USER;
              setUser({
                ...firebaseUser,
                role,
              } as AuthUser);
            } catch (error) {
              console.error('Error getting user token:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        })();
      });
    };

    void setupAuth();

    return (): void => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const hasRole = (role: UserRole): boolean => {
    if (!user || !user.role) {
      return false;
    }
    return user.role === role;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.role) {
      return false;
    }
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
