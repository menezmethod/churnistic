'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

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
          Please sign in to access this page.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/')}
            data-testid="home-button"
          >
            Go to Home
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push('/auth/signin')}
            data-testid="signin-button"
          >
            Go to Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
