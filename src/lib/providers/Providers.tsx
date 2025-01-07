'use client';

import { QueryClient } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { ClientAuthProvider } from '@/lib/auth/ClientAuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

import { QueryProvider } from './QueryProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider queryClient={queryClient}>
      <ThemeProvider>
        <ClientAuthProvider>{children}</ClientAuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
