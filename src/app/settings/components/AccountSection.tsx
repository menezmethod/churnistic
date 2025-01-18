import {
  Email as EmailIcon,
  Lock as LockIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  TextField as MuiTextField,
} from '@mui/material';
import { useState } from 'react';

import type { UserProfile } from './types';

interface AccountSectionProps {
  profile: UserProfile | null;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  StyledTextField?: React.ComponentType<import('@mui/material').TextFieldProps>;
}

export function AccountSection({
  profile,
  onChangePassword,
  onDeleteAccount,
  StyledTextField = MuiTextField,
}: AccountSectionProps) {
  const TextField = StyledTextField;
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await onChangePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE') {
      try {
        await onDeleteAccount();
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>
        Account Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Manage your account settings and preferences
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <EmailIcon />
            <Typography variant="subtitle2" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Email Preferences
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}
          >
            Current email: {profile?.email}
          </Typography>
        </Box>

        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <LockIcon />
            <Typography variant="subtitle2" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Password
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => setPasswordDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Change Password
          </Button>
          <Typography
            variant="body2"
            sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}
          >
            Last changed:{' '}
            {profile?.passwordLastChanged
              ? new Date(profile.passwordLastChanged).toLocaleDateString()
              : 'Never'}
          </Typography>
        </Box>

        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <DeleteIcon color="error" />
            <Typography
              variant="subtitle2"
              sx={{ fontSize: '1rem', fontWeight: 600, color: 'error.main' }}
            >
              Delete Account
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Delete Account
          </Button>
        </Box>
      </Box>

      <Dialog
        open={passwordDialogOpen}
        onClose={() => !isChangingPassword && setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Error</AlertTitle>
                {passwordError}
              </Alert>
            )}
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              disabled={isChangingPassword}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              disabled={isChangingPassword}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              disabled={isChangingPassword}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            disabled={isChangingPassword}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            sx={{ textTransform: 'none' }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
              This action cannot be undone. This will permanently delete your account and
              remove all your data from our servers.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Please type <strong>DELETE</strong> to confirm:
            </Typography>
            <TextField
              fullWidth
              value={deleteConfirmation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeleteConfirmation(e.target.value)
              }
              placeholder="Type DELETE to confirm"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'DELETE'}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
