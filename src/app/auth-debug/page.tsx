'use client';

import { AuthDebug } from '@/components/auth/AuthDebug';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AuthDebugPage() {
  return (
    <ProtectedRoute>
      <AuthDebug />
    </ProtectedRoute>
  );
}
