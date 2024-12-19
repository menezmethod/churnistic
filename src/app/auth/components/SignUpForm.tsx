import { Alert, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/auth';
import { compareStrings } from '@/lib/utils';

export const SignUpForm = (): JSX.Element | null => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Invalid email format');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const passwordsMatch = compareStrings(password, confirmPassword);
      if (!passwordsMatch) {
        setError('Passwords do not match');
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during sign up';
      setError(errorMessage);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Sign Up
        </Typography>
        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form
          onSubmit={(e): void => {
            void handleSubmit(e);
          }}
          role="form"
        >
          <TextField
            id="email"
            label="Email"
            type="email"
            required
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{
              'aria-label': 'Email',
            }}
            data-testid="email-input"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            required
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{
              'aria-label': 'Password',
            }}
            data-testid="password-input"
          />
          <TextField
            id="confirm-password"
            label="Confirm Password"
            type="password"
            required
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            inputProps={{
              'aria-label': 'Confirm Password',
            }}
            data-testid="confirm-password-input"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            data-testid="signup-button"
          >
            Sign Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
