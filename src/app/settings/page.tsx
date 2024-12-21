'use client';

import {
  CloudUpload as CloudUploadIcon,
  Google as GoogleIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert as MuiAlert,
  AlertTitle,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import type { WithFieldValue, DocumentData } from 'firebase/firestore';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useCallback, useEffect, useState, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { useTheme } from '@/lib/theme/ThemeContext';

// Our custom gray palette
const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  300: 'hsl(220, 20%, 80%)',
  400: 'hsl(220, 20%, 65%)',
  500: 'hsl(220, 20%, 42%)',
  600: 'hsl(220, 20%, 35%)',
  700: 'hsl(220, 20%, 25%)',
  800: 'hsl(220, 30%, 6%)',
  900: 'hsl(220, 35%, 3%)',
} as const;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps): JSX.Element {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: '24px 32px' }}>{children}</Box>}
    </div>
  );
}

interface UserProfile {
  displayName: string;
  customDisplayName: string;
  email: string;
  bio: string;
  photoURL: string | null;
  role: string;
  updatedAt?: string;
  emailPreferences: {
    marketing: boolean;
    security: boolean;
  };
  passwordLastChanged?: string;
  notifications: {
    creditCardAlerts: boolean;
    bankBonusAlerts: boolean;
    investmentAlerts: boolean;
    riskAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showActivity: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

interface AccountSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.mode === 'light' ? gray[600] : gray[400],
  '&.Mui-selected': {
    color: theme.palette.mode === 'light' ? gray[800] : '#FFFFFF',
    fontWeight: 600,
  },
  minHeight: 48,
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.mode === 'light' ? gray[200] : gray[700]}`,
  '& .MuiTabs-indicator': {
    backgroundColor: '#0B5CFF',
    height: 2,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
    '& fieldset': {
      borderColor: theme.palette.mode === 'light' ? gray[200] : gray[700],
    },
    '&:hover fieldset': {
      borderColor: '#0B5CFF',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0B5CFF',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: theme.palette.mode === 'light' ? gray[800] : '#FFFFFF',
  },
}));

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

const SettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const { setMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile(profileData);
        if (profileData.preferences?.theme) {
          setMode(profileData.preferences.theme);
        }
      } else {
        // Get the ID token result to access custom claims
        const tokenResult = await user.getIdTokenResult();
        const userRole = (tokenResult.claims.role as string) || 'user';

        const initialProfile: UserProfile = {
          displayName: user.displayName || '',
          customDisplayName: user.displayName || '',
          email: user.email || '',
          bio: '',
          photoURL: user.photoURL || '',
          role: userRole,
          emailPreferences: {
            marketing: true,
            security: true,
          },
          notifications: {
            creditCardAlerts: true,
            bankBonusAlerts: true,
            investmentAlerts: true,
            riskAlerts: true,
          },
          privacy: {
            profileVisibility: 'public' as const,
            showEmail: false,
            showActivity: true,
          },
          preferences: {
            theme: 'system' as const,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
        await setDoc(docRef, initialProfile);
        setProfile(initialProfile);
        setMode('system');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setMode('system');
    } finally {
      setLoading(false);
    }
  }, [user, setMode]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const wrapAsyncHandler = <T extends unknown[]>(
    handler: (...args: T) => Promise<void>
  ): ((...args: T) => void) => {
    return (...args: T): void => {
      void handler(...args).catch((error) => {
        console.error('Error in async handler:', error);
        setSnackbar({
          open: true,
          message: 'An error occurred',
          severity: 'error',
        });
      });
    };
  };

  const safeUpdateDocument = async (
    userId: string,
    data: WithFieldValue<DocumentData>
  ): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleEmailPreferenceChange = async (
    field: string,
    value: boolean
  ): Promise<void> => {
    if (!user || !profile) {
      return;
    }

    try {
      await safeUpdateDocument(user.uid, {
        [`emailPreferences.${field}`]: value,
      });

      setProfile((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          emailPreferences: {
            ...prev.emailPreferences,
            [field]: value,
          },
        };
      });

      setSnackbar({
        open: true,
        message: 'Email preferences updated',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update email preferences',
        severity: 'error',
      });
    }
  };

  const handlePrivacyChange = async (field: string, value: boolean): Promise<void> => {
    if (!user || !profile) {
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        [`privacy.${field}`]: value,
        updatedAt: new Date().toISOString(),
      });

      setProfile((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            [field]: value,
          },
        };
      });

      setSnackbar({
        open: true,
        message: 'Privacy settings updated',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update privacy settings',
        severity: 'error',
      });
    }
  };

  const handleProfileVisibilityChange = async (
    option: 'public' | 'private'
  ): Promise<void> => {
    if (!user || !profile) {
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        'privacy.profileVisibility': option,
        updatedAt: new Date().toISOString(),
      });

      setProfile((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            profileVisibility: option,
          },
        };
      });

      setSnackbar({
        open: true,
        message: 'Profile visibility updated',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating profile visibility:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile visibility',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const renderProfileContent = (): JSX.Element => (
    <>
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: '30px',
          fontWeight: 600,
          mb: 2,
          color: (theme) =>
            theme.palette.mode === 'dark' ? 'hsl(0, 0%, 100%)' : '#101828',
        }}
      >
        Profile
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.875rem',
          color: 'text.secondary',
          mb: 4,
        }}
      >
        Manage your personal information and preferences
      </Typography>

      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Role
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              mb: 2,
              textTransform: 'capitalize',
            }}
          >
            {profile?.role || 'user'}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Your photo{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              mb: 2,
            }}
          >
            This will be displayed on your profile.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={profile?.photoURL || undefined}
              alt={profile?.displayName || 'User avatar'}
              sx={{
                width: 64,
                height: 64,
                border: '4px solid #FFFFFF',
                boxShadow:
                  '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
              }}
            />
            <Box>
              <Button
                variant="outlined"
                onClick={handlePhotoDialogOpen}
                disabled={uploadingPhoto}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  borderColor: '#D0D5DD',
                  mr: 1,
                  px: 2.5,
                  py: 1.25,
                  '&:hover': {
                    borderColor: '#0B5CFF',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {uploadingPhoto ? 'Uploading...' : 'Change photo'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Name{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <StyledTextField
              fullWidth
              placeholder="First name"
              value={profile?.customDisplayName?.split(' ')[0] || ''}
              onChange={(e) =>
                setProfile((prev) => {
                  if (!prev) {
                    return null;
                  }
                  return {
                    ...prev,
                    customDisplayName:
                      e.target.value +
                      ' ' +
                      (prev.customDisplayName?.split(' ')[1] || ''),
                  };
                })
              }
            />
            <StyledTextField
              fullWidth
              placeholder="Last name"
              value={profile?.customDisplayName?.split(' ')[1] || ''}
              onChange={(e) =>
                setProfile((prev) => {
                  if (!prev) {
                    return null;
                  }
                  return {
                    ...prev,
                    customDisplayName:
                      (prev.customDisplayName?.split(' ')[0] ?? '') +
                      ' ' +
                      e.target.value,
                  };
                })
              }
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            pt: 4,
            mt: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            disabled={saving}
            onClick={(): void => {
              void fetchProfile();
            }}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.primary',
              borderColor: '#D0D5DD',
              px: 2.5,
              py: 1.25,
              '&:hover': {
                borderColor: '#0B5CFF',
                backgroundColor: 'transparent',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 2.5,
              py: 1.25,
              bgcolor: '#0B5CFF',
              '&:hover': {
                bgcolor: '#0B4ECC',
              },
              '&:disabled': {
                bgcolor: '#0B5CFF',
                opacity: 0.7,
              },
            }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </Box>
      </Box>

      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {renderGooglePhotoButton()}
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleClickFileInput}
              disabled={uploadingPhoto}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                color: 'text.primary',
                borderColor: '#D0D5DD',
                py: 1.25,
              }}
            >
              Upload Custom Photo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Typography variant="caption" color="text.secondary">
              Supported formats: JPG, PNG, GIF (max. 5MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPhotoDialogOpen(false)}
            disabled={uploadingPhoto}
            sx={{
              textTransform: 'none',
              color: 'text.primary',
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const renderAccountContent = (): JSX.Element => {
    const sections: AccountSection[] = [
      {
        title: 'Email Preferences',
        description: 'Manage your email notifications and communication preferences',
        icon: <EmailIcon sx={{ color: 'text.primary' }} />,
        content: (
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={profile?.emailPreferences?.marketing ?? true}
                  onChange={wrapAsyncHandler((e: React.ChangeEvent<HTMLInputElement>) =>
                    handleEmailPreferenceChange('marketing', e.target.checked)
                  )}
                />
              }
              label="Marketing emails"
            />
          </FormGroup>
        ),
      },
      {
        title: 'Password',
        description: 'Manage your password and security settings',
        icon: <LockIcon sx={{ color: 'text.primary' }} />,
        content: (
          <Box>
            <Button
              variant="outlined"
              onClick={() => setPasswordDialogOpen(true)}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                color: 'text.primary',
                borderColor: '#D0D5DD',
                px: 2.5,
                py: 1.25,
                '&:hover': {
                  borderColor: '#0B5CFF',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Change password
            </Button>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                mt: 1,
              }}
            >
              Last changed:{' '}
              {profile?.passwordLastChanged
                ? new Date(profile.passwordLastChanged).toLocaleDateString()
                : 'Never'}
            </Typography>

            <Dialog
              open={passwordDialogOpen}
              onClose={() => !changingPassword && setPasswordDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Change Password</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {passwordError}
                    </Alert>
                  )}
                  <StyledTextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    disabled={changingPassword}
                  />
                  <StyledTextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    disabled={changingPassword}
                  />
                  <StyledTextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    disabled={changingPassword}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={changingPassword}
                  sx={{
                    textTransform: 'none',
                    color: 'text.primary',
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handlePasswordChange} disabled={changingPassword}>
                  Change Password
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ),
      },
      {
        title: 'Delete Account',
        description: 'Permanently delete your account and all associated data',
        icon: <DeleteIcon sx={{ color: 'error.main' }} />,
        content: (
          <Box>
            <MuiAlert
              severity="error"
              sx={{
                mb: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <AlertTitle>Warning: This action cannot be undone</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                When you delete your account:
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>All your data will be permanently deleted</li>
                  <li>You will lose access to all your projects and settings</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  mt: 1,
                }}
              >
                Delete account
              </Button>
            </MuiAlert>

            <Dialog
              open={deleteDialogOpen}
              onClose={() => !deletingAccount && setDeleteDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  <Typography variant="body1" sx={{ color: 'text.primary' }}>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Please type <strong>DELETE</strong> to confirm:
                  </Typography>
                  <StyledTextField
                    fullWidth
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={deletingAccount}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={deletingAccount}
                  sx={{
                    textTransform: 'none',
                    color: 'text.primary',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteClick}
                  disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
                  variant="contained"
                  color="error"
                  sx={{
                    textTransform: 'none',
                  }}
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ),
      },
    ];

    return (
      <>
        <Typography
          variant="h6"
          sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 1 }}
        >
          Account Settings
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
        >
          Manage your account settings and preferences
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map((section, index) => (
            <Box key={section.title}>
              {index > 0 && <Divider sx={{ mb: 4 }} />}
              <Box sx={{ display: 'flex', gap: 3 }}>
                {section.icon}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1,
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    {section.description}
                  </Typography>
                  {section.content}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </>
    );
  };

  const renderNotificationsContent = (): JSX.Element => (
    <>
      <Typography
        variant="h6"
        sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 1 }}
      >
        Notification Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Choose which updates and alerts you want to receive
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={profile?.notifications?.creditCardAlerts ?? true}
                onChange={(e): void => {
                  if (!user || !profile) {
                    return;
                  }
                  void (async (): Promise<void> => {
                    try {
                      const docRef = doc(db, 'users', user.uid);
                      await updateDoc(docRef, {
                        'notifications.creditCardAlerts': e.target.checked,
                        updatedAt: new Date().toISOString(),
                      });
                      setProfile((prev): UserProfile | null => {
                        if (!prev) {
                          return null;
                        }
                        return {
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            creditCardAlerts: e.target.checked,
                          },
                        };
                      });
                    } catch (error) {
                      console.error('Error updating notification:', error);
                    }
                  })();
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Credit Card Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Get notified about application deadlines, minimum spend requirements,
                  and bonus qualification status
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile?.notifications?.bankBonusAlerts ?? true}
                onChange={(e): void => {
                  if (!user || !profile) {
                    return;
                  }
                  void (async (): Promise<void> => {
                    try {
                      const docRef = doc(db, 'users', user.uid);
                      await updateDoc(docRef, {
                        'notifications.bankBonusAlerts': e.target.checked,
                        updatedAt: new Date().toISOString(),
                      });
                      setProfile((prev): UserProfile | null => {
                        if (!prev) {
                          return null;
                        }
                        return {
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            bankBonusAlerts: e.target.checked,
                          },
                        };
                      });
                    } catch (error) {
                      console.error('Error updating notification:', error);
                    }
                  })();
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Bank Bonus Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Receive updates about direct deposit requirements, minimum balance
                  alerts, and bonus payout timelines
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile?.notifications?.investmentAlerts ?? true}
                onChange={(e): void => {
                  if (!user || !profile) {
                    return;
                  }
                  void (async (): Promise<void> => {
                    try {
                      const docRef = doc(db, 'users', user.uid);
                      await updateDoc(docRef, {
                        'notifications.investmentAlerts': e.target.checked,
                        updatedAt: new Date().toISOString(),
                      });
                      setProfile((prev): UserProfile | null => {
                        if (!prev) {
                          return null;
                        }
                        return {
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            investmentAlerts: e.target.checked,
                          },
                        };
                      });
                    } catch (error) {
                      console.error('Error updating notification:', error);
                    }
                  })();
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Investment Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Stay informed about investment bonus opportunities, holding period
                  requirements, and transfer deadlines
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile?.notifications?.riskAlerts ?? true}
                onChange={(e): void => {
                  if (!user || !profile) {
                    return;
                  }
                  void (async (): Promise<void> => {
                    try {
                      const docRef = doc(db, 'users', user.uid);
                      await updateDoc(docRef, {
                        'notifications.riskAlerts': e.target.checked,
                        updatedAt: new Date().toISOString(),
                      });
                      setProfile((prev): UserProfile | null => {
                        if (!prev) {
                          return null;
                        }
                        return {
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            riskAlerts: e.target.checked,
                          },
                        };
                      });
                    } catch (error) {
                      console.error('Error updating notification:', error);
                    }
                  })();
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Risk Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Get important alerts about credit score changes, application velocity
                  limits, and ChexSystems activity
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </FormGroup>
      </Box>
    </>
  );

  const renderPrivacyContent = (): JSX.Element => (
    <>
      <Typography
        variant="h6"
        sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 1 }}
      >
        Privacy Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Manage your privacy settings and control what others can see
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 2 }}
          >
            Profile Visibility
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['public', 'private'].map((option) => (
              <Button
                key={option}
                variant={
                  profile?.privacy?.profileVisibility === option
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() => {
                  void handleProfileVisibilityChange(option as 'public' | 'private');
                }}
                sx={{
                  textTransform: 'capitalize',
                  px: 3,
                  py: 1,
                  ...(profile?.privacy?.profileVisibility === option
                    ? {
                        bgcolor: '#0B5CFF',
                        '&:hover': {
                          bgcolor: '#0B4ECC',
                        },
                      }
                    : {
                        color: 'text.primary',
                        borderColor: '#D0D5DD',
                        '&:hover': {
                          borderColor: '#0B5CFF',
                          bgcolor: 'transparent',
                        },
                      }),
                }}
              >
                {option}
              </Button>
            ))}
          </Box>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={profile?.privacy?.showEmail ?? false}
                onChange={(e) => {
                  void handlePrivacyChange('showEmail', e.target.checked);
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Show Email Address
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Allow others to see your email address
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile?.privacy?.showActivity ?? true}
                onChange={(e) => {
                  void handlePrivacyChange('showActivity', e.target.checked);
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5CFF',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#0B5CFF',
                    },
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}
                >
                  Show Activity
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Show when you&apos;re active on the platform
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </FormGroup>
      </Box>
    </>
  );

  const renderPreferencesContent = (): JSX.Element => {
    const timezones = Intl.supportedValuesOf('timeZone');
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
    ];

    const handlePreferenceChange = async (
      key: keyof UserPreferences,
      value: string | boolean
    ): Promise<void> => {
      if (!user || !profile) {
        console.warn('No user or profile found when updating preferences');
        setSnackbar({
          open: true,
          message: 'Please sign in to update preferences',
          severity: 'error',
        });
        return;
      }

      try {
        // Create a new preferences object with default values if none exist
        const currentPreferences = profile.preferences || {
          theme: 'system',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notifications: {
            email: true,
            push: true,
          },
        };

        // Update the specific preference
        const updatedPreferences = {
          ...currentPreferences,
          [key]: value,
        };

        // Update the profile document
        await updateDoc(doc(db, 'users', user.uid), {
          preferences: updatedPreferences,
        });

        // Update local state
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            preferences: updatedPreferences,
          };
        });

        // Update theme mode if theme preference was changed
        if (key === 'theme' && typeof value === 'string') {
          setMode(value as 'light' | 'dark' | 'system');
        }

        // Show success message
        setSnackbar({
          open: true,
          message: 'Preferences updated successfully',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error updating preferences:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update preferences',
          severity: 'error',
        });
      }
    };

    const handleThemeChange = (option: string): void => {
      if (!user || !profile) {
        console.warn('No user or profile found when changing theme');
        setSnackbar({
          open: true,
          message: 'Please sign in to change theme preferences',
          severity: 'error',
        });
        return;
      }

      try {
        const themeMode = option as 'light' | 'dark' | 'system';
        void handlePreferenceChange('theme', themeMode);
      } catch (error) {
        console.error('Error changing theme:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update theme preference',
          severity: 'error',
        });
      }
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      void handlePreferenceChange('language', e.target.value);
    };

    const handleTimezoneUpdate = (e: React.ChangeEvent<HTMLInputElement>): void => {
      void handlePreferenceChange('timezone', e.target.value);
    };

    return (
      <>
        <Typography
          variant="h6"
          sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary', mb: 1 }}
        >
          Preferences
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
        >
          Customize your experience with personal preferences
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 2 }}
            >
              Theme
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {['light', 'dark', 'system'].map((option) => (
                <Button
                  key={option}
                  variant={
                    (profile?.preferences?.theme || 'system') === option
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={(): void => handleThemeChange(option)}
                  sx={{
                    textTransform: 'capitalize',
                    px: 3,
                    py: 1,
                    ...(profile?.preferences?.theme === option
                      ? {
                          bgcolor: '#0B5CFF',
                          '&:hover': {
                            bgcolor: '#0B4ECC',
                          },
                        }
                      : {
                          color: 'text.primary',
                          borderColor: '#D0D5DD',
                          '&:hover': {
                            borderColor: '#98A2B3',
                          },
                        }),
                  }}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 2 }}
            >
              Language
            </Typography>
            <StyledTextField
              select
              fullWidth
              value={profile?.preferences?.language ?? 'en'}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </StyledTextField>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 2 }}
            >
              Timezone
            </Typography>
            <StyledTextField
              select
              fullWidth
              value={
                profile?.preferences?.timezone ??
                Intl.DateTimeFormat().resolvedOptions().timeZone
              }
              onChange={handleTimezoneUpdate}
            >
              {timezones.map((timezone) => (
                <MenuItem key={timezone} value={timezone}>
                  {timezone.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </StyledTextField>
          </Box>
        </Box>
      </>
    );
  };

  const handlePasswordChange = (): void => {
    if (!user?.email || passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    setChangingPassword(true);
    void (async (): Promise<void> => {
      try {
        if (!user.email) {
          throw new Error('Email is required');
        }
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordData.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwordData.newPassword);
        setPasswordDialogOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error) {
        console.error('Error changing password:', error);
        setPasswordError(
          error instanceof Error ? error.message : 'Failed to change password'
        );
      } finally {
        setChangingPassword(false);
      }
    })();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!user || !profile) {
      return;
    }
    setSaving(true);

    void (async (): Promise<void> => {
      try {
        // Update Firestore
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          customDisplayName: profile.customDisplayName,
          displayName: profile.customDisplayName,
          updatedAt: new Date().toISOString(),
        });

        // Refresh the profile
        await fetchProfile();

        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update profile',
          severity: 'error',
        });
      } finally {
        setSaving(false);
      }
    })();
  };

  const handlePhotoUpload = async (file: File): Promise<void> => {
    if (!user || !profile) {
      setSnackbar({
        open: true,
        message: 'Please sign in to upload a photo',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    const storageRef = ref(storage, `users/${user.uid}/profile-photo`);
    try {
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { photoURL: photoURL || '' });
      setProfile((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, photoURL: photoURL || '' };
      });
      setSnackbar({
        open: true,
        message: 'Photo uploaded successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to upload photo',
        severity: 'error',
      });
    } finally {
      setSaving(false);
      setPhotoDialogOpen(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      void handlePhotoUpload(file);
    }
  };

  const handleUseGooglePhoto = async (): Promise<void> => {
    const maybeUser = user;
    const maybeProfile = profile;
    if (!maybeUser || !maybeProfile) {
      return;
    }

    const maybePhotoURL = maybeUser.photoURL;
    if (!maybePhotoURL) {
      return;
    }

    try {
      setUploadingPhoto(true);

      if (
        maybeProfile.photoURL &&
        !maybeProfile.photoURL.includes('googleusercontent.com')
      ) {
        try {
          const oldPhotoRef = ref(storage, maybeProfile.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (error) {
          console.error('Error deleting old photo:', error);
        }
      }

      const docRef = doc(db, 'users', maybeUser.uid);
      await updateDoc(docRef, {
        photoURL: maybePhotoURL,
        updatedAt: new Date().toISOString(),
      });

      setProfile((prev) => updateProfileState(prev, { photoURL: maybePhotoURL }));

      setSnackbar({
        open: true,
        message: 'Using Google profile photo',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error setting Google photo:', error);
      setSnackbar({
        open: true,
        message: 'Failed to set Google profile photo',
        severity: 'error',
      });
    } finally {
      setUploadingPhoto(false);
      setPhotoDialogOpen(false);
    }
  };

  const renderGooglePhotoButton = (): JSX.Element | null => {
    const maybeUser = user;
    const maybeProfile = profile;
    if (!maybeUser || !maybeProfile) {
      return null;
    }

    const maybePhotoURL = maybeUser.photoURL;
    if (!maybePhotoURL) {
      return null;
    }

    const handleClick = async (): Promise<void> => {
      await handleUseGooglePhoto();
    };

    const handleButtonClick = (): void => {
      void handleClick();
    };

    return (
      <Button
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleButtonClick}
        disabled={uploadingPhoto}
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem',
          color: 'text.primary',
          borderColor: '#D0D5DD',
          py: 1.25,
        }}
      >
        Use Google Profile Photo
      </Button>
    );
  };

  const wrappedHandleDeleteAccount = wrapAsyncHandler(async () => {
    if (!user || !profile || deleteConfirmation !== 'DELETE') {
      return;
    }
    setDeletingAccount(true);
    const docRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(docRef, { deleted: true });
      await deleteUser(user);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete account',
        severity: 'error',
      });
    } finally {
      setDeletingAccount(false);
    }
  });

  const updateProfileState = (
    prev: UserProfile | null,
    updates: Partial<UserProfile>
  ): UserProfile | null => {
    if (!prev) {
      return prev;
    }
    return {
      ...prev,
      ...updates,
    };
  };

  const handlePhotoDialogOpen = (): void => {
    setPhotoDialogOpen(true);
  };

  const handleDeleteClick = (): void => {
    if (deleteConfirmation === 'DELETE') {
      void wrappedHandleDeleteAccount();
    }
  };

  const handleClickFileInput = (): void => {
    const fileInput = fileInputRef.current;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Initialize theme from profile preferences
  useEffect(() => {
    if (!profile) return;

    try {
      const theme = profile.preferences?.theme || 'system';
      setMode(theme);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Default to system theme if there's an error
      setMode('system');
    }
  }, [profile, setMode]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: '1128px',
          py: '32px',
          bgcolor: (theme) => (theme.palette.mode === 'light' ? '#FFFFFF' : gray[900]),
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: '30px',
            fontWeight: 600,
            mb: 2,
            color: (theme) =>
              theme.palette.mode === 'dark' ? 'hsl(0, 0%, 100%)' : '#101828',
          }}
        >
          Profile
        </Typography>

        <Paper
          elevation={0}
          sx={{
            bgcolor: (theme) => (theme.palette.mode === 'light' ? '#FFFFFF' : gray[900]),
            borderRadius: '12px',
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'light' ? gray[200] : gray[700],
            overflow: 'hidden',
          }}
        >
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="profile tabs"
            sx={{
              minHeight: '44px',
              '& .MuiTabs-flexContainer': {
                minHeight: '44px',
              },
              '& .MuiTab-root': {
                minHeight: '44px',
                py: 0,
              },
            }}
          >
            <StyledTab label="General" />
            <StyledTab label="Account" />
            <StyledTab label="Notifications" />
            <StyledTab label="Privacy" />
            <StyledTab label="Preferences" />
          </StyledTabs>

          <TabPanel value={activeTab} index={0}>
            {renderProfileContent()}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {renderAccountContent()}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {renderNotificationsContent()}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {renderPrivacyContent()}
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            {renderPreferencesContent()}
          </TabPanel>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: snackbar.severity === 'success' ? '#027A48' : '#B42318',
            color: '#FFFFFF',
            fontSize: '0.875rem',
          },
        }}
      />
    </Box>
  );
};

export default SettingsPage;
