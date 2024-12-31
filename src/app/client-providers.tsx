'use client';;
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { TRPCProvider } from '@/lib/trpc/provider';

import { Providers } from './providers';

import type { JSX } from "react";

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
