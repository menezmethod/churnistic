'use client';

import { type ReactNode } from 'react';

import { ThemeProvider } from '@/app/styles/theme/ThemeContext';
import { ClientAuthProvider } from '@/lib/auth/ClientAuthProvider';

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
