import { Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signUp(email, password, displayName);
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Sign up failed');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}
    >
      <Typography variant="h4" component="h1" gutterBottom data-testid="signup-title">
        Sign Up
      </Typography>

      <TextField
        fullWidth
        margin="normal"
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        data-testid="displayname-input"
        required
      />

      <TextField
        fullWidth
        margin="normal"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
        required
      />

      <TextField
        fullWidth
        margin="normal"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
        required
      />

      <TextField
        fullWidth
        margin="normal"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        data-testid="confirm-password-input"
        required
      />

      {error && (
        <Typography color="error" data-testid="error-message">
          {error}
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        data-testid="signup-button"
      >
        Sign Up
      </Button>
    </Box>
  );
}
