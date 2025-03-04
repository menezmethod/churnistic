'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !loading &&
      (!user || !(hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)))
    ) {
      router.push('/auth/signin');
    }
  }, [user, loading, hasRole, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !(hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN))) {
    return null;
  }

  return <>{children}</>;
}
