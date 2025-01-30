'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          data-testid="error-title"
          sx={{ textAlign: 'center' }}
        >
          Access Denied
        </Typography>
        <Typography
          variant="body1"
          paragraph
          data-testid="error-message"
          sx={{ textAlign: 'center', mb: 4 }}
        >
          {user
            ? "You don't have permission to access this page. Please contact an administrator if you believe this is a mistake."
            : 'Please sign in to access this page.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/')}
            data-testid="home-button"
          >
            Go to Home
          </Button>
          {!user && (
            <Button
              variant="contained"
              onClick={() => router.push('/auth/signin')}
              data-testid="signin-button"
            >
              Go to Sign In
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
