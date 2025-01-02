'use client';

import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';
import { trpc } from '@/lib/trpc/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: userProfile, isLoading: profileLoading } = trpc.user.me.useQuery(
    undefined,
    {
      enabled: !!user, // Only fetch profile when user is authenticated
    }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (!profileLoading && userProfile?.role !== UserRole.ADMIN) {
      router.push('/unauthorized');
      return;
    }
  }, [user, router, userProfile, authLoading, profileLoading]);

  // Show loading state while checking authentication and profile
  if (authLoading || profileLoading) {
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

  // Show nothing if not authenticated
  if (!user) {
    return null;
  }

  // Show nothing if not admin
  if (userProfile?.role !== UserRole.ADMIN) {
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
