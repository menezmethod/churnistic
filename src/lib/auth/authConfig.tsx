'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  type LoginCredentials,
  type RegisterCredentials,
  loadUser,
  loginWithEmail,
  registerWithEmail,
  logout,
} from './authService';

export function useUser() {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: loadUser,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ['auth-login'],
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        console.log('Attempting login with credentials:', {
          email: credentials.email,
          hasPassword: !!credentials.password,
        });
        const user = await loginWithEmail(credentials);
        console.log('Login successful:', {
          uid: user.uid,
          email: user.email,
          hasCustomClaims: !!user.customClaims,
        });
        return user;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (user) => {
      console.log('Login mutation success, updating query data');
      queryClient.setQueryData(['auth-user'], user);
      router.refresh();
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      queryClient.setQueryData(['auth-user'], null);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ['auth-register'],
    mutationFn: async (credentials: RegisterCredentials) => {
      try {
        console.log('Attempting registration');
        const user = await registerWithEmail(credentials);
        console.log('Registration successful:', {
          uid: user.uid,
          email: user.email,
        });
        return user;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: (user) => {
      console.log('Registration mutation success, updating query data');
      queryClient.setQueryData(['auth-user'], user);
      router.refresh();
    },
    onError: (error) => {
      console.error('Registration mutation error:', error);
      queryClient.setQueryData(['auth-user'], null);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ['auth-logout'],
    mutationFn: async () => {
      try {
        console.log('Attempting logout');
        await logout();
        console.log('Logout successful');
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Logout mutation success, clearing query data');
      queryClient.setQueryData(['auth-user'], null);
      queryClient.removeQueries();
      router.refresh();
      router.replace('/auth/signin');
    },
    onError: (error) => {
      console.error('Logout mutation error:', error);
    },
  });
}

interface AuthLoaderProps {
  children: React.ReactNode;
  renderLoading: () => React.ReactNode;
  renderUnauthenticated: () => React.ReactNode;
}

export function AuthLoader({
  children,
  renderLoading,
  renderUnauthenticated,
}: AuthLoaderProps) {
  const { data: user, isPending } = useUser();

  if (isPending) {
    return <>{renderLoading()}</>;
  }

  if (!user) {
    return <>{renderUnauthenticated()}</>;
  }

  return <>{children}</>;
}
