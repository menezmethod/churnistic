'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserSettings } from '@/lib/hooks/useSettings';

interface AccountSectionProps {
  user: User;
  settings: UserSettings;
  supabase: SupabaseClient;
  StyledTextField: any;
}

export function AccountSection({
  user,
  settings,
  supabase,
  StyledTextField,
}: AccountSectionProps) {
  const theme = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleOpenPasswordDialog = () => {
    setShowPasswordDialog(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
    setError(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      // Using Supabase Auth to update the password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess('Password updated successfully');
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Close dialog after short delay
      setTimeout(() => {
        handleClosePasswordDialog();
      }, 2000);
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError((err as Error).message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // First, delete user data from the database
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Error deleting profile data: ${profileError.message}`);
      }

      // Then delete the user from auth
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);

      if (userError) {
        throw new Error(`Error deleting user account: ${userError.message}`);
      }

      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to home (this will be handled by AuthContext)
      window.location.href = '/';
      
    } catch (err) {
      console.error('Error deleting account:', err);
      setError((err as Error).message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2.5}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 600,
            color: theme.palette.mode === 'light' ? 'text.primary' : '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          Account Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: theme.palette.mode === 'light' ? 'background.paper' : 'hsl(220, 35%, 3%)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'hsl(220, 20%, 88%)' : 'hsl(220, 20%, 25%)'}`,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Account Information
            </Typography>

            <Stack direction="row" spacing={2}>
              <StyledTextField
                fullWidth
                label="Email Address"
                value={user?.email || ''}
                disabled
              />
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Security
            </Typography>

            <Button
              variant="outlined"
              onClick={handleOpenPasswordDialog}
              size="small"
              sx={{
                py: 1,
                px: 2,
                maxWidth: 'fit-content',
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Change Password
            </Button>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and all of your data. This action cannot be
                undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenDeleteDialog}
                size="small"
                sx={{
                  py: 1,
                  px: 2,
                  maxWidth: 'fit-content',
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Delete Account
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={handleClosePasswordDialog}
        aria-labelledby="password-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            maxWidth: 'sm',
            width: '100%',
          },
        }}
      >
        <DialogTitle id="password-dialog-title" sx={{ pb: 1 }}>
          Change Password
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Please enter your current password and choose a new secure password.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <StyledTextField
              fullWidth
              label="Current Password"
              type={showPassword.current ? 'text' : 'password'}
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShowPassword('current')}
                      edge="end"
                      size="small"
                    >
                      {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              label="New Password"
              type={showPassword.new ? 'text' : 'password'}
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShowPassword('new')}
                      edge="end"
                      size="small"
                    >
                      {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              label="Confirm New Password"
              type={showPassword.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleShowPassword('confirm')}
                      edge="end"
                      size="small"
                    >
                      {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClosePasswordDialog}
            variant="outlined"
            disabled={isChangingPassword}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              isChangingPassword ||
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword
            }
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              px: 2,
            }}
          >
            {isChangingPassword ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Change Password'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{
            pb: 1,
            color: 'error.main',
          }}
        >
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be
            undone and all your data will be permanently deleted.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            disabled={isDeleting}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              px: 2,
            }}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
