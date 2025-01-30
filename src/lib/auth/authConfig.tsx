'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth-login'],
    mutationFn: (credentials: LoginCredentials) => loginWithEmail(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth-user'], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth-register'],
    mutationFn: (credentials: RegisterCredentials) => registerWithEmail(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth-user'], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth-logout'],
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth-user'], null);
      // Invalidate all queries on logout
      queryClient.removeQueries();
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
