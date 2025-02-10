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
    // Only redirect if we're sure the user is not authenticated or not an admin
    if (!authLoading) {
      console.log('Auth state:', {
        user: user?.email,
        isAdmin: hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN),
        isSuperAdmin: isSuperAdmin(),
      });

      if (!user) {
        console.log('No user found, redirecting to signin');
        router.push('/auth/signin');
      } else if (!hasRole(UserRole.ADMIN) && !isSuperAdmin()) {
        console.log('User lacks admin/superadmin role, redirecting to unauthorized');
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

  // Don't render anything if not authenticated or not admin
  if (!user || (!hasRole(UserRole.ADMIN) && !isSuperAdmin())) {
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
