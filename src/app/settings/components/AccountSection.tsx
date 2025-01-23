import {
  Email as EmailIcon,
  Lock as LockIcon,
  DeleteOutline as DeleteIcon,
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as CheckIcon,
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
  Fade,
  Stack,
  useTheme,
  IconButton,
  InputAdornment,
  Tooltip,
  Zoom,
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
  const theme = useTheme();
  const TextField = StyledTextField;
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await onChangePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
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

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Fade in timeout={300}>
      <Stack spacing={2.5}>
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 600,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Account Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Manage your account settings and preferences
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: `${theme.palette.primary.main}08`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${theme.palette.primary.main}14`,
                  }}
                >
                  <EmailIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '1.25rem',
                    }}
                  />
                </Box>
                <Stack spacing={0.5} flex={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Email Preferences
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {profile?.email}
                    </Typography>
                    <Tooltip
                      title="Email verified"
                      placement="right"
                      TransitionComponent={Zoom}
                    >
                      <CheckIcon
                        sx={{
                          fontSize: '1rem',
                          color: theme.palette.success.main,
                        }}
                      />
                    </Tooltip>
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${theme.palette.primary.main}14`,
                  }}
                >
                  <LockIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '1.25rem',
                    }}
                  />
                </Box>
                <Stack spacing={0.5} flex={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Password
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialogOpen(true)}
                      size="small"
                      sx={{
                        maxWidth: 'fit-content',
                        textTransform: 'none',
                        borderRadius: 1,
                      }}
                    >
                      Change Password
                    </Button>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Last changed:{' '}
                      {profile?.passwordLastChanged
                        ? new Date(profile.passwordLastChanged).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.error.main}`,
                bgcolor: `${theme.palette.error.main}08`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${theme.palette.error.main}14`,
                  }}
                >
                  <DeleteIcon
                    sx={{
                      color: theme.palette.error.main,
                      fontSize: '1.25rem',
                    }}
                  />
                </Box>
                <Stack spacing={0.5} flex={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: theme.palette.error.main }}
                  >
                    Delete Account
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                    size="small"
                    sx={{
                      maxWidth: 'fit-content',
                      textTransform: 'none',
                      borderRadius: 1,
                    }}
                  >
                    Delete Account
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Dialog
          open={passwordDialogOpen}
          onClose={() => !isChangingPassword && setPasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1,
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle
            sx={{
              p: 2,
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            Change Password
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              {passwordError && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 1 }}>
                  <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                  {passwordError}
                </Alert>
              )}
              {showSuccess && (
                <Alert severity="success" icon={<CheckIcon />} sx={{ borderRadius: 1 }}>
                  <AlertTitle sx={{ fontWeight: 600 }}>Success</AlertTitle>
                  Password changed successfully
                </Alert>
              )}
              <TextField
                fullWidth
                size="small"
                type={showPasswords.current ? 'text' : 'password'}
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                disabled={isChangingPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        edge="end"
                        size="small"
                      >
                        <LockIcon
                          sx={{
                            fontSize: '1.25rem',
                            opacity: showPasswords.current ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                size="small"
                type={showPasswords.new ? 'text' : 'password'}
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                disabled={isChangingPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                        size="small"
                      >
                        <LockIcon
                          sx={{
                            fontSize: '1.25rem',
                            opacity: showPasswords.new ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                size="small"
                type={showPasswords.confirm ? 'text' : 'password'}
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                disabled={isChangingPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                        size="small"
                      >
                        <LockIcon
                          sx={{
                            fontSize: '1.25rem',
                            opacity: showPasswords.confirm ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              disabled={isChangingPassword}
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
              }}
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1,
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle
            sx={{
              p: 2,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: theme.palette.error.main,
            }}
          >
            Delete Account
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 1 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Warning</AlertTitle>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </Alert>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Please type <strong>DELETE</strong> to confirm:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={deleteConfirmation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDeleteConfirmation(e.target.value)
                }
                placeholder="Type DELETE to confirm"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderColor: theme.palette.error.main,
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              variant="contained"
              color="error"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
              }}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Fade>
  );
}
