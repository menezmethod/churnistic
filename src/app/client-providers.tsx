'use client';
import type { JSX } from 'react';

import { ThemeProvider } from '@/app/styles/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { TRPCProvider } from '@/lib/trpc/provider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <QueryProvider>
      <TRPCProvider>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </TRPCProvider>
    </QueryProvider>
  );
}
