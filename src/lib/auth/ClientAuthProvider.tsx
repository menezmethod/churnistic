'use client';

import { AuthProvider } from './AuthContext';

export function ClientAuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
} 