'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>;
}
