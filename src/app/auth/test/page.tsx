'use client';

import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/lib/providers/ToastProvider';
import { supabase } from '@/lib/supabase/client';

export default function AuthTestPage() {
  const { user, signIn, signUp, signOut, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    void getSession();
  }, []);

  const handleTestSignIn = async () => {
    try {
      await signIn('test@example.com', 'password123');
      showToast({ message: 'Sign in successful', severity: 'success' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Sign in failed',
        severity: 'error',
      });
    }
  };

  const handleTestSignUp = async () => {
    try {
      await signUp('test@example.com', 'password123');
      showToast({ message: 'Sign up successful', severity: 'success' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Sign up failed',
        severity: 'error',
      });
    }
  };

  const handleTestSignOut = async () => {
    try {
      await signOut();
      showToast({ message: 'Sign out successful', severity: 'success' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Sign out failed',
        severity: 'error',
      });
    }
  };

  const handleTestGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast({ message: 'Google sign in initiated', severity: 'info' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Google sign in failed',
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Auth Test Page
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Current User:
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Current Session:
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {session ? JSON.stringify(session, null, 2) : 'No session'}
            </pre>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleTestSignIn}>
              Test Sign In
            </Button>
            <Button variant="contained" onClick={handleTestSignUp}>
              Test Sign Up
            </Button>
            <Button variant="contained" onClick={handleTestSignOut} color="error">
              Test Sign Out
            </Button>
            <Button
              variant="contained"
              onClick={handleTestGoogleSignIn}
              color="secondary"
            >
              Test Google Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
