'use client';

import { CircularProgress, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth, UserRole } from '@/lib/auth';
import { trpc } from '@/lib/trpc/client';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AdminProtectedRoute({
  children,
  requiredRole = UserRole.ADMIN,
}: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: userProfile, isLoading: profileLoading } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: !!user, // Only fetch profile when user is authenticated
    }
  );

  // Helper function to check if user has required role
  const hasRequiredRole = (userRole: string | undefined, required: UserRole): boolean => {
    if (!userRole) return false;

    // Admin has access to everything
    if (userRole === UserRole.ADMIN) return true;

    // For other roles, they must match exactly
    return userRole === required;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (
      !profileLoading &&
      userProfile &&
      !hasRequiredRole(userProfile.role, requiredRole)
    ) {
      router.push('/unauthorized');
      return;
    }
  }, [user, authLoading, profileLoading, userProfile, requiredRole, router]);

  if (authLoading || profileLoading) {
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

  if (!user || !userProfile || !hasRequiredRole(userProfile.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
