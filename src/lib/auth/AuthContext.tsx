'use client';

import { useQueryClient } from '@tanstack/react-query';
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

import { useUser, useLogin, useRegister, useLogout } from './authConfig';
import {
  loginWithGoogle,
  loginWithGithub,
  resetPassword as resetPasswordService,
  isSuperAdmin as checkIsSuperAdmin,
} from './authService';
import type { AuthUser } from './authService';

interface AuthContextType {
  user: AuthUser | null;
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

const AuthContext = createContext<AuthContextType>({
  user: null,
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
  isOnline: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const { mutateAsync: login } = useLogin();
  const { mutateAsync: register } = useRegister();
  const { mutateAsync: logoutMutation } = useLogout();
  const [contextUpdateCounter, setContextUpdateCounter] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[AuthContext] Forcing re-render:', contextUpdateCounter);
  }, [contextUpdateCounter]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await login({ email, password });
      router.push('/dashboard');
    },
    [login, router]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      await register({ email, password });
    },
    [register]
  );

  const signOut = useCallback(async () => {
    await logoutMutation({});
    router.push('/auth/signin');
  }, [logoutMutation, router]);

  const handleSignInWithGoogle = useCallback(async () => {
    await loginWithGoogle();
    setContextUpdateCounter((prev) => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
    await queryClient.fetchQuery({ queryKey: ['authenticated-user'] });
  }, [setContextUpdateCounter, queryClient]);

  const handleSignInWithGithub = useCallback(async () => {
    await loginWithGithub();
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    await resetPasswordService(email);
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
      if (checkIsSuperAdmin(user)) return true;
      const userRole = user.customClaims?.role as UserRole;
      if (!userRole) return false;
      return ROLE_PERMISSIONS[userRole].includes(permission);
    },
    [user]
  );

  const isSuperAdmin = useCallback(() => {
    return checkIsSuperAdmin(user ?? null);
  }, [user]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      loading: isLoading,
      isAdmin: hasRole(UserRole.ADMIN),
      hasRole,
      hasPermission,
      isSuperAdmin,
      signIn,
      signUp,
      signOut,
      signInWithGoogle: handleSignInWithGoogle,
      signInWithGithub: handleSignInWithGithub,
      resetPassword: handleResetPassword,
      isOnline: true,
    }),
    [
      user,
      isLoading,
      hasRole,
      hasPermission,
      isSuperAdmin,
      signIn,
      signUp,
      signOut,
      handleSignInWithGoogle,
      handleSignInWithGithub,
      handleResetPassword,
    ]
  );

  console.log('[AuthContext] Provider value updated:', {
    user: user?.email,
    loading: isLoading,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
