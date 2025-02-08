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

import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithGoogle } from '@/lib/firebase/utils/auth';

import { GoogleIcon } from '../components/icons';

export default function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
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
      if (!signUp) {
        throw new Error('Sign up function not available');
      }
      await signUp(formData.email, formData.password);
      router.push('/dashboard');
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
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.code === 'auth/popup-closed-by-user') {
          setError('Sign up was cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
          setError('Pop-up was blocked. Please allow pop-ups and try again.');
        } else if (error.code === 'auth/unauthorized-domain') {
          setError('This domain is not authorized for Google sign-up.');
        } else {
          setError(`Google sign up failed: ${error.message}`);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred during Google sign up. Please try again.'
      );
    } finally {
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
