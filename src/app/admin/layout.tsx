'use client';

import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';
import { trpc } from '@/lib/trpc/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: userProfile, isLoading } = trpc.user.me.useQuery();

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!isLoading && userProfile?.role !== UserRole.ADMIN) {
      router.push('/unauthorized');
      return;
    }
  }, [user, router, userProfile, isLoading]);

  // Show nothing while checking authentication
  if (isLoading || !user) {
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
