'use client';
import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { JSX } from 'react';

import { ThemeProvider } from '@/app/styles/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
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
