'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission, UserRole } from '@/lib/auth/types';

export interface AuthOptions {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: AuthOptions = {}
): React.FC<P> {
  return function WithAuthComponent(props: P): JSX.Element | null {
    const { user, loading, hasRole, hasPermission } = useAuth();
    const router = useRouter();
    const { requiredRole, requiredPermissions = [], redirectTo = '/signin' } = options;

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(redirectTo);
          return;
        }

        if (user) {
          if (requiredRole && !hasRole(requiredRole)) {
            router.push('/dashboard');
            return;
          }

          if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every((permission) =>
              hasPermission(permission)
            );
            if (!hasAllPermissions) {
              router.push('/dashboard');
              return;
            }
          }
        }
      }
    }, [
      user,
      loading,
      hasRole,
      hasPermission,
      router,
      requiredRole,
      requiredPermissions,
      redirectTo,
    ]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"
          />
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return null;
    }

    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );
      if (!hasAllPermissions) {
        return null;
      }
    }

    return <WrappedComponent {...props} />;
  };
}
