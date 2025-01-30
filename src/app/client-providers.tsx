'use client';
import type { JSX } from 'react';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ThemeProvider } from '@/styles/theme/ThemeContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
