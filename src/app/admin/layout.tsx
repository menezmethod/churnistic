'use client';

import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ role: UserRole | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      try {
        // Simulate fetching user profile. Replace with actual fetch logic
        // const response = await fetch('/api/user/profile');
        // const data = await response.json();
        // setUserProfile(data);
        // For now, simulate a successful fetch with a default role
        setUserProfile({ role: UserRole.ADMIN });
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

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
