'use client';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import type { JSX } from 'react';

import { resetPassword } from '@/lib/firebase/utils/auth';

interface ForgotPasswordProps {
  open: boolean;
  onCloseAction: () => void;
}

export function ForgotPassword({
  open,
  onCloseAction,
}: ForgotPasswordProps): JSX.Element {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        if (resetError.code === 'auth/user-not-found') {
          setError('No account found with this email address.');
        } else {
          throw resetError;
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          onCloseAction();
          setEmail('');
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCloseAction}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to reset
          your password.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Password reset email sent! Check your inbox.
          </Alert>
        )}
        <TextField
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e): void => setEmail(e.target.value)}
          disabled={isLoading}
          error={!!error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
