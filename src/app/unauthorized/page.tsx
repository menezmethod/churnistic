'use client';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage(): JSX.Element {
  const router = useRouter();

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        gap: 3,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        401
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        You don&apos;t have permission to access this page. Please contact your
        administrator if you believe this is a mistake.
      </Typography>
      <Button variant="contained" onClick={() => router.push('/')} sx={{ marginTop: 2 }}>
        Return to Home
      </Button>
    </Container>
  );
}
