'use client';

import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AuthLoader } from '@/lib/auth/core/authConfig';

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);
  return null;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <AuthLoader
      renderLoading={() => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      renderUnauthenticated={() => <RedirectToLogin />}
    >
      {children}
    </AuthLoader>
  );
}
