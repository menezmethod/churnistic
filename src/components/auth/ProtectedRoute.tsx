'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { UserRole, Permission } from '@/lib/auth/types';

import { useAuth } from './AuthProvider';
import { LoadingScreen } from '../ui/LoadingScreen';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
};

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  if (requiredRole && user.role !== requiredRole) {
    router.push('/unauthorized');
    return null;
  }

  if (
    requiredPermissions.length > 0 &&
    (!user.permissions ||
      !requiredPermissions.every((p) => user.permissions!.includes(p)))
  ) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}
