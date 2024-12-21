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
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Unauthorized Access
        </Typography>
        <Typography variant="body1" paragraph>
          You do not have permission to access this page. Please sign in with an
          authorized account.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push('/auth/signin')}
        >
          Go to Sign In
        </Button>
      </Box>
    </Container>
  );
}
