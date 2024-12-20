'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

import { Providers } from './providers';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps): JSX.Element {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Providers>{children}</Providers>
      </ThemeProvider>
    </AuthProvider>
  );
}
