'use client';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { JSX } from 'react';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { TRPCProvider } from '@/lib/trpc/provider';
import { ThemeProvider } from '@/styles/theme/ThemeContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: true,
            retry: 1,
            networkMode: 'always',
          },
          mutations: {
            networkMode: 'always',
          },
        },
      })
  );

  return (
    <QueryProvider queryClient={queryClient}>
      <TRPCProvider queryClient={queryClient}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </TRPCProvider>
    </QueryProvider>
  );
}
