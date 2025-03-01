'use client';

import { Box, CircularProgress, Container } from '@mui/material';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/providers/AuthProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  const isCallbackPage = pathname === '/auth/callback';

  // Don't apply layout to callback page
  if (isCallbackPage) {
    return children;
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))'
            : 'radial-gradient(ellipse at 50% 50%, hsl(220, 30%, 10%), hsl(220, 30%, 8%))',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
