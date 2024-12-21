'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission, UserRole } from '@/lib/auth/types';
import { ROLE_PERMISSIONS } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
  redirectTo = '/auth/signin',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  console.log('ProtectedRoute render:', {
    loading,
    user: user
      ? {
          uid: user.uid,
          email: user.email,
          customClaims: user.customClaims,
        }
      : null,
    requiredRole,
    requiredPermissions,
  });

  useEffect(() => {
    if (!loading) {
      console.log('Auth state settled:', {
        hasUser: !!user,
        userDetails: user
          ? {
              uid: user.uid,
              email: user.email,
              customClaims: user.customClaims,
            }
          : null,
      });

      if (!user) {
        console.log('No user found, redirecting to:', redirectTo);
        router.replace(redirectTo);
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        console.log('User lacks required role:', {
          required: requiredRole,
          userRole: user.customClaims?.role,
        });
        router.replace('/unauthorized');
        return;
      }

      if (requiredPermissions) {
        const userPermissions = user.customClaims?.role
          ? ROLE_PERMISSIONS[user.customClaims.role as UserRole]
          : [];
        console.log('Checking permissions:', {
          required: requiredPermissions,
          userHas: userPermissions,
        });

        const hasAllPermissions = requiredPermissions.every((permission) =>
          hasPermission(permission)
        );
        if (!hasAllPermissions) {
          console.log('User lacks required permissions');
          router.replace('/unauthorized');
          return;
        }
      }

      console.log('Access granted to protected route');
    }
  }, [
    loading,
    user,
    requiredRole,
    requiredPermissions,
    router,
    redirectTo,
    hasRole,
    hasPermission,
  ]);

  if (loading) {
    console.log('Showing loading spinner');
    return loadingComponent || <LoadingSpinner />;
  }

  if (!user) {
    console.log('No user, rendering null');
    return null;
  }

  console.log('Rendering protected content');
  return <>{children}</>;
}
