'use client';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        gap: 4,
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Welcome to Churnistic
      </Typography>
      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          color: 'text.secondary',
          maxWidth: '800px',
          marginBottom: 4,
        }}
      >
        Your Ultimate Credit Card Churning Companion
      </Typography>

      <Stack direction="row" spacing={2}>
        {user ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/dashboard')}
            sx={{ minWidth: 200 }}
          >
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/signin')}
              sx={{ minWidth: 200 }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/auth/signup')}
              sx={{ minWidth: 200 }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Stack>

      <Container maxWidth="md" sx={{ marginTop: 8 }}>
        <Typography variant="h3" component="h3" gutterBottom>
          Features
        </Typography>
        <Stack spacing={4} sx={{ textAlign: 'left' }}>
          <div>
            <Typography variant="h6" gutterBottom>
              🎯 Smart Card Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Keep track of all your credit cards, application statuses, and important
              dates in one place.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              💰 Rewards Optimization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Maximize your rewards by tracking points, miles, and cashback across all
              your cards.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              📊 Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visualize your churning strategy with detailed analytics and insights.
            </Typography>
          </div>
        </Stack>
      </Container>
    </Container>
  );
}
