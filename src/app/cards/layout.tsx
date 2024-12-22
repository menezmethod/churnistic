'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
