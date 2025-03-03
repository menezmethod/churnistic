'use client';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import React, { useState } from 'react';

interface SecuritySettingsProps {
  user: User;
  supabase: SupabaseClient;
}

export default function SecuritySettings({ user, supabase }: SecuritySettingsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword((show) => !show);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword((show) => !show);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePasswords()) {
      return;
    }

    setIsUpdating(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResetEmail = async () => {
    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      if (!user.email) {
        throw new Error('No email address associated with this account');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email);

      if (resetError) {
        throw resetError;
      }

      setSuccess('Password reset email sent successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send password reset email'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Update your password to keep your account secure
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Success</AlertTitle>
              {success}
            </Alert>
          )}

          <form onSubmit={handlePasswordUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="outlined-adornment-current-password">
                    Current Password
                  </InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Current Password"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="outlined-adornment-new-password">
                    New Password
                  </InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={handleClickShowNewPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="New Password"
                  />
                  <FormHelperText>
                    Password must be at least 8 characters long
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="outlined-adornment-confirm-password">
                    Confirm New Password
                  </InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Confirm New Password"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isUpdating}
                  sx={{ mr: 2 }}
                >
                  {isUpdating ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSendResetEmail}
                  disabled={isUpdating}
                >
                  Send Reset Email
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Login Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage your active login sessions
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="subtitle1">Current Session</Typography>
              <Typography variant="body2" color="text.secondary">
                This is your current active session
              </Typography>
            </Box>
            <Box>
              <Button variant="outlined" color="primary" disabled>
                Revoke
              </Button>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            For security reasons, you can only see your current session.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add an extra layer of security to your account
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Status: <strong>Not Enabled</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Two-factor authentication adds an additional layer of security to your
              account by requiring more than just a password to sign in.
            </Typography>
          </Box>

          <Button variant="contained" color="primary" disabled>
            Enable Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
