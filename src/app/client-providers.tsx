'use client';
import type { JSX } from 'react';

import { Providers } from './providers';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { TRPCProvider } from '@/lib/trpc/provider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <Providers>
      <ThemeProvider>
        <AuthProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </AuthProvider>
      </ThemeProvider>
    </Providers>
  );
}
