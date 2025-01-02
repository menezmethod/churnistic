'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission, UserRole } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/auth/signin',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push('/unauthorized');
      return;
    }

    setIsAuthorized(true);
  }, [
    user,
    loading,
    requiredRole,
    requiredPermission,
    hasRole,
    hasPermission,
    router,
    redirectTo,
  ]);

  if (loading || isAuthorized === null) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <div data-testid="protected-content">{children}</div>;
}
