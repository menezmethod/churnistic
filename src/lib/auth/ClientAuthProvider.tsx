'use client';;
import { AuthProvider } from './AuthContext';

import type { JSX } from "react";

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
