'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';

import { ForgotPassword } from './ForgotPassword';
import { GoogleIcon } from './icons';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

interface ExtendedFormHelperTextProps extends FormHelperTextProps {
  'data-testid'?: string;
}

export function SignIn(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);

  React.useEffect((): void => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const validateInputs = (email: string, password: string): boolean => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);

    const data = new FormData(event.currentTarget);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    if (!validateInputs(email, password)) {
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/invalid-email'
        ) {
          setEmailError(true);
          setPasswordError(true);
          setEmailErrorMessage('Invalid email or password.');
          setPasswordErrorMessage('Invalid email or password.');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setEmailError(true);
      setEmailErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign in error:', {
          code: error.code,
          message: error.message,
          originalError: error.originalError,
        });
        
        // Handle specific error cases
        if (error.code === 'auth/popup-closed-by-user') {
          setEmailError(true);
          setEmailErrorMessage('Sign in was cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
          setEmailError(true);
          setEmailErrorMessage('Pop-up was blocked. Please allow pop-ups and try again.');
        } else if (error.code === 'auth/unauthorized-domain') {
          setEmailError(true);
          setEmailErrorMessage('This domain is not authorized for Google sign-in.');
        } else {
          setEmailError(true);
          setEmailErrorMessage(`Google sign in failed: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (!emailError) {
        setEmailError(true);
        setEmailErrorMessage('An error occurred with Google sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignInContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Sign in
        </Typography>
        <Box
          component="form"
          onSubmit={(e): void => {
            void handleSubmit(e);
          }}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              disabled={isLoading}
              FormHelperTextProps={
                {
                  'data-testid': 'email-helper-text',
                  id: 'email-helper-text',
                } as ExtendedFormHelperTextProps
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
              disabled={isLoading}
              FormHelperTextProps={
                {
                  'data-testid': 'password-helper-text',
                  id: 'password-helper-text',
                } as ExtendedFormHelperTextProps
              }
            />
          </FormControl>
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" disabled={isLoading} />}
            label="Remember me"
          />
          <Button type="submit" fullWidth variant="contained" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <Link
            component="button"
            type="button"
            onClick={() => setForgotPasswordOpen(true)}
            variant="body2"
            sx={{ alignSelf: 'center' }}
            disabled={isLoading}
          >
            Forgot your password?
          </Link>
        </Box>
        <Divider>or</Divider>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={(): void => {
              void handleGoogleSignIn();
            }}
            startIcon={<GoogleIcon />}
            disabled={isLoading}
          >
            Sign in with Google
          </Button>
          <Typography sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" variant="body2" sx={{ alignSelf: 'center' }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Card>
      <ForgotPassword
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </SignInContainer>
  );
}
