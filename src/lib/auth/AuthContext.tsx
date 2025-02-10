'use client';

import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo } from 'react';

import type { Permission, UserRole } from '@/lib/auth/types';
import { ROLE_PERMISSIONS } from '@/lib/auth/types';
import { useAuth as useSupabaseAuth } from '@/lib/hooks/useAuth';

interface AuthUser extends User {
  role?: UserRole;
  isSuperAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
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
  const {
    user: supabaseUser,
    loading: authLoading,
    signIn: supabaseSignIn,
    signUp: supabaseSignUp,
    signOut: supabaseSignOut,
  } = useSupabaseAuth();

  const user = useMemo(() => {
    if (!supabaseUser) return null;
    return {
      ...supabaseUser,
      role: supabaseUser.user_metadata?.role as UserRole | undefined,
      isSuperAdmin: supabaseUser.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    };
  }, [supabaseUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await supabaseSignIn({ email, password });
      router.push('/dashboard');
    },
    [supabaseSignIn, router]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      await supabaseSignUp({ email, password });
    },
    [supabaseSignUp]
  );

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    router.push('/auth/signin');
  }, [supabaseSignOut, router]);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      if (user.isSuperAdmin) return true;
      if (!user.role) return false;
      return ROLE_PERMISSIONS[user.role].includes(permission);
    },
    [user]
  );

  const isSuperAdmin = useCallback(() => {
    return user?.isSuperAdmin ?? false;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading: authLoading,
      hasRole,
      hasPermission,
      isSuperAdmin,
      signIn,
      signUp,
      signOut,
      signInWithGoogle: async () => {}, // TODO: Implement OAuth
      signInWithGithub: async () => {}, // TODO: Implement OAuth
      resetPassword: async () => {}, // TODO: Implement password reset
      isOnline: true,
    }),
    [user, authLoading, hasRole, hasPermission, isSuperAdmin, signIn, signUp, signOut]
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
