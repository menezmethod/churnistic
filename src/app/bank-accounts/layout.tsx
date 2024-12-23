'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function BankAccountsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
