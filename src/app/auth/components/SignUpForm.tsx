'use client';

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

import { GoogleIcon } from '../components/icons';

export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
          },
        },
      });

      if (signUpError) throw signUpError;

      router.push('/auth/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred during Google sign up. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      role="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        p: 3,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom textAlign="center">
        Create Account
      </Typography>

      <Button
        fullWidth
        variant="outlined"
        onClick={handleGoogleSignUp}
        startIcon={<GoogleIcon />}
        disabled={loading}
        sx={{
          py: 1,
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(66, 133, 244, 0.04)',
          },
        }}
      >
        Sign up with Google
      </Button>

      <Divider sx={{ my: 1 }}>or</Divider>

      <TextField
        label="Display Name"
        required
        fullWidth
        value={formData.displayName}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, displayName: e.target.value }))
        }
        data-testid="displayname-input"
        disabled={loading}
      />

      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        value={formData.email}
        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        data-testid="email-input"
        disabled={loading}
      />

      <TextField
        label="Password"
        type="password"
        required
        fullWidth
        value={formData.password}
        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        data-testid="password-input"
        disabled={loading}
      />

      <TextField
        label="Confirm Password"
        type="password"
        required
        fullWidth
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
        }
        data-testid="confirm-password-input"
        disabled={loading}
      />

      {error && (
        <Alert severity="error" data-testid="error-alert">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        data-testid="signup-button"
        sx={{
          py: 1,
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign Up with Email'}
      </Button>
    </Box>
  );
}
