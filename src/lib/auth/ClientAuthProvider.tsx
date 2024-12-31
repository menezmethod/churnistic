'use client';
import type { JSX } from 'react';

import { AuthProvider } from './AuthContext';

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
