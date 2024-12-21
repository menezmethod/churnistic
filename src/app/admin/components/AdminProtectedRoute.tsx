'use client';

import { CircularProgress, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AdminProtectedRoute({
  children,
  requiredRole = UserRole.ADMIN,
}: AdminProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
      return;
    }

    if (!loading && user && !hasRole(requiredRole)) {
      router.push('/unauthorized');
    }
  }, [user, loading, hasRole, requiredRole, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user || !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
