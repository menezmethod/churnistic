'use client';

import { Box, Typography, Paper, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSupabase } from '@/lib/providers/SupabaseProvider';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useSupabase();

  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow:
              'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We've sent you an email with a verification link. Please check your inbox and
            click the link to verify your email address.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once verified, you'll be automatically redirected to your dashboard.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
