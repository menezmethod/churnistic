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
  useRef,
} from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

import type { Permission, UserRole } from '@/lib/auth/types';
import { ROLE_PERMISSIONS } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';

import { useLogin, useLogout, useRegister, useUser } from './authConfig';
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
  const queryClient = useQueryClient();
  
  console.log('🏗️ [AuthProvider] Rendering provider', {
    timestamp: new Date().toISOString(),
    renderTime: performance.now()
  });
  
  // Use React Query's built-in states directly
  const { 
    data: user, 
    isLoading: userLoading, 
    refetch, 
    status, 
    fetchStatus,
    error
  } = useUser();
  
  // Debugging for React Query states
  useEffect(() => {
    console.log('🔍 [AuthProvider] React Query states:', {
      status,
      fetchStatus,
      isLoading: userLoading,
      hasData: !!user,
      errorState: error ? 'Error present' : 'No error',
      timestamp: new Date().toISOString()
    });
  }, [status, fetchStatus, userLoading, user, error]);
  
  // Simplify loading state - just check if we're fetching and don't have a user
  const isAuthLoading = userLoading && !user;
  
  console.log('🔄 [AuthProvider] Calculated loading state:', {
    isAuthLoading,
    userLoading,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });
  
  const { mutateAsync: login } = useLogin();
  const { mutateAsync: register } = useRegister();
  const { mutateAsync: logoutMutation } = useLogout();
  
  // Improve logging for debugging by adding a single place to track all state changes
  useEffect(() => {
    console.log('🔐 [AuthProvider] State update:', { 
      status,
      fetchStatus, 
      userLoading, 
      error: error ? 'Error occurred' : undefined,
      user: user ? { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isSuperAdmin: user.isSuperAdmin 
      } : null,
      timestamp: new Date().toISOString()
    });
  }, [user, userLoading, status, fetchStatus, error]);

  // Auth helper functions
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await login({ email, password });
        await queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
        await refetch();
        router.push('/dashboard');
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    },
    [login, queryClient, refetch, router]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        await register({ email, password });
        await queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
        await refetch();
      } catch (error) {
        console.error('Sign up error:', error);
        throw error;
      }
    },
    [register, queryClient, refetch]
  );

  const signOut = useCallback(async () => {
    try {
      await logoutMutation();
      queryClient.clear(); // Clear entire cache on logout
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [logoutMutation, queryClient, router]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      await loginWithGoogle();
      // Auth state change listener will handle session state
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    try {
      await loginWithGithub();
      // Auth state change listener will handle session state
    } catch (error) {
      console.error('GitHub sign-in error:', error);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    await resetPasswordService(email);
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const hasPermission = useCallback((permission: Permission) => {
    if (!user) return false;
    
    // Super admin always has all permissions
    if (user.isSuperAdmin) return true;
    
    if (!user.role) return false;
    
    const roleStr = String(user.role).toLowerCase();
    const roleKey = roleStr as keyof typeof ROLE_PERMISSIONS;
    const permissions = ROLE_PERMISSIONS[roleKey] || [];
    
    return permissions.includes(permission);
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    if (!user) return false;
    
    // Check by email first
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    if (superAdminEmail && 
        user.email && 
        user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
      return true;
    }
    
    // Then check by role
    return user.isSuperAdmin;
  }, [user]);

  // Simplify loading state - let React Query handle it
  const value = useMemo<AuthContextType>(() => {
    const contextValue = {
      user: user ?? null,
      // Only consider loading if we don't have a user yet and are still loading
      loading: isAuthLoading,
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
    };
    
    // Log the context value being provided
    console.log('🔄 [AuthProvider] Creating context value:', {
      hasUser: !!contextValue.user,
      userId: contextValue.user?.id || 'none',
      userEmail: contextValue.user?.email || 'none',
      isLoading: contextValue.loading,
      timestamp: new Date().toISOString(),
      queryStatus: status,
      fetchStatus: fetchStatus,
      memo: 'This log shows when the context value is recreated'
    });
    
    return contextValue;
  }, [
    user,
    isAuthLoading,
    hasRole,
    hasPermission,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    handleSignInWithGoogle,
    handleSignInWithGithub,
    handleResetPassword,
    status,
    fetchStatus
  ]);

  // Log before rendering provider
  console.log('🧩 [AuthProvider] Rendering with auth state:', {
    hasUser: !!value.user,
    loading: value.loading,
    timestamp: new Date().toISOString()
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('❌ [useAuth] Hook used outside of AuthProvider!');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Log when context is consumed
  console.log('👤 [useAuth] Context consumed:', { 
    hasUser: !!context.user,
    userEmail: context.user?.email || 'none',
    loading: context.loading,
    // Include stack trace depth to help debug where it's being called from
    callDepth: new Error().stack?.split('\n').length || 0,
    timestamp: new Date().toISOString()
  });
  
  return context;
}
