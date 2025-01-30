'use client';

import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, hasRole, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Debug log the current auth state
    console.log('AdminLayout - Auth State:', {
      user: user?.email,
      role: user?.role,
      isSuperAdmin: user?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
      hasAdminRole: hasRole?.(UserRole.ADMIN),
      hasSuperAdminRole: hasRole?.(UserRole.SUPERADMIN),
      loading: authLoading,
    });

    // Only redirect if we're sure about the authentication state
    if (!authLoading) {
      if (!user) {
        console.log('AdminLayout - No user, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      // Check for admin access
      const hasAdminAccess =
        isSuperAdmin() || hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPERADMIN);
      console.log('AdminLayout - Access Check:', {
        email: user.email,
        isSuperAdmin: isSuperAdmin(),
        hasAdminRole: hasRole(UserRole.ADMIN),
        hasSuperAdminRole: hasRole(UserRole.SUPERADMIN),
        hasAccess: hasAdminAccess,
      });

      if (!hasAdminAccess) {
        console.log('AdminLayout - No admin access, redirecting to unauthorized');
        router.push('/unauthorized');
      }
    }
  }, [user, router, authLoading, hasRole, isSuperAdmin]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check for admin access before rendering
  const hasAdminAccess =
    user && (isSuperAdmin() || hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPERADMIN));

  // Don't render anything if not authenticated or no admin access
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
}
