'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure about the auth state
    if (!loading) {
      if (!user) {
        router.push('/signin');
        return;
      }

      if (!hasRole(UserRole.ADMIN)) {
        router.push('/unauthorized');
      }
    }
  }, [user, hasRole, loading, router]);

  // Show loading state while checking auth
  if (loading) {
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
  if (!user || !hasRole(UserRole.ADMIN)) {
    return null;
  }

  return <>{children}</>;
} 