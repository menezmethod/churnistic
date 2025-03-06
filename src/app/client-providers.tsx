'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { JSX } from 'react';

import { ThemeProvider } from '@/app/styles/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <AppRouterCacheProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </AppRouterCacheProvider>
  );
}
