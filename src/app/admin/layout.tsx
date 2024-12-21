'use client';

import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { trpc } from '@/lib/trpc/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        const userProfile = await trpc.user.me.query();
        if (!userProfile.isAdmin) {
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/unauthorized');
      }
    };

    checkAdminAccess();
  }, [user, router]);

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
