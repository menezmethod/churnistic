'use client';

import { type ReactNode } from 'react';

import { ClientAuthProvider } from '@/lib/auth/ClientAuthProvider';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

import { QueryProvider } from './QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ClientAuthProvider>{children}</ClientAuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
