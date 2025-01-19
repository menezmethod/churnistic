'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { AuthContextType, Permission, UserRole } from '@/lib/auth';
import { hasPermission, hasRole } from '@/lib/auth';

import { useUser, useLogin, useRegister, useLogout } from '../core/authConfig';
import {
  loginWithGoogle,
  loginWithGithub,
  resetPassword as resetPasswordService,
} from '../core/service';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
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
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const { mutateAsync: login } = useLogin();
  const { mutateAsync: register } = useRegister();
  const { mutateAsync: logoutMutation } = useLogout();

  const signIn = useCallback(
    async (email: string, password: string) => {
      await login({ email, password });
    },
    [login]
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
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    await loginWithGithub();
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    await resetPasswordService(email);
  }, []);

  const checkHasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      return hasRole(user.role, role);
    },
    [user]
  );

  const checkHasPermission = useCallback(
    (permission: Permission) => {
      if (!user?.role) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user: user ?? null,
      session: null,
      loading: isLoading,
      hasRole: checkHasRole,
      hasPermission: checkHasPermission,
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
      checkHasRole,
      checkHasPermission,
      signIn,
      signUp,
      signOut,
      handleSignInWithGoogle,
      handleSignInWithGithub,
      handleResetPassword,
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
