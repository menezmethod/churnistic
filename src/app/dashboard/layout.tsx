'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole={UserRole.USER}>{children}</ProtectedRoute>;
}
