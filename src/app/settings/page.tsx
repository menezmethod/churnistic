'use client';

import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { JSX, useCallback, useEffect, useState } from 'react';

import { useTheme } from '@/app/styles/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { getFirebaseServices } from '@/lib/firebase/config';

import { AccountSection } from './components/AccountSection';
import { NotificationsSection } from './components/NotificationsSection';
import { PreferencesSection } from './components/PreferencesSection';
import { PrivacySection } from './components/PrivacySection';
import { ProfileSection } from './components/ProfileSection';
import type { UserProfile } from './components/types';

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

const StyledContainer = styled(Container)(({ theme }) => ({
  maxWidth: '1536px', // xl container width
  padding: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
  borderRadius: '20px',
  border: '1px solid',
  borderColor: theme.palette.mode === 'light' ? gray[200] : gray[700],
  overflow: 'hidden',
  transition: 'all 0.2s ease-in-out',
  boxShadow:
    theme.palette.mode === 'light'
      ? '0px 12px 32px -4px rgba(16, 24, 40, 0.1), 0px 6px 16px -6px rgba(16, 24, 40, 0.08)'
      : '0px 8px 24px -4px rgba(0, 0, 0, 0.4), 0px 4px 8px -2px rgba(0, 0, 0, 0.25)',
  '&:hover': {
    boxShadow:
      theme.palette.mode === 'light'
        ? '0px 16px 40px -4px rgba(16, 24, 40, 0.12), 0px 8px 24px -6px rgba(16, 24, 40, 0.1)'
        : '0px 12px 32px -4px rgba(0, 0, 0, 0.5), 0px 6px 12px -4px rgba(0, 0, 0, 0.3)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.mode === 'light' ? gray[200] : gray[700]}`,
  '& .MuiTabs-indicator': {
    backgroundColor: '#0B5CFF',
    height: 3,
    borderRadius: '3px',
    transition: 'all 0.2s ease-in-out',
  },
  '& .MuiTabs-flexContainer': {
    gap: '12px',
    padding: '0 24px',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.mode === 'light' ? gray[600] : gray[400],
  '&.Mui-selected': {
    color: theme.palette.mode === 'light' ? gray[800] : '#FFFFFF',
    fontWeight: 600,
  },
  minHeight: 56,
  padding: '16px 28px',
  borderRadius: '12px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? gray[50] : gray[800],
    color: theme.palette.mode === 'light' ? gray[800] : '#FFFFFF',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: theme.palette.mode === 'light' ? gray[200] : gray[700],
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: '#0B5CFF',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0B5CFF',
      borderWidth: '1px',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    padding: '12px 16px',
    color: theme.palette.mode === 'light' ? gray[800] : '#FFFFFF',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    color: theme.palette.mode === 'light' ? gray[600] : gray[400],
    '&.Mui-focused': {
      color: '#0B5CFF',
    },
  },
}));

const SettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const { setMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { firestore } = await getFirebaseServices();
      const docRef = doc(firestore, 'users', user.uid);
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

  const handleProfileUpdate = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !profile) return;

    try {
      const { firestore } = await getFirebaseServices();
      const docRef = doc(firestore, 'users', user.uid);
      await updateDoc(docRef, updates);
      setProfile({ ...profile, ...updates });
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
    }
  };

  const handlePhotoChange = async (file: File): Promise<void> => {
    if (!user) return;

    try {
      const { storage } = await getFirebaseServices();
      const storageRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL });
      await handleProfileUpdate({ photoURL });
    } catch (error) {
      console.error('Error updating photo:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update photo',
        severity: 'error',
      });
    }
  };

  const handlePasswordChange = async (currentPassword: string): Promise<void> => {
    if (!user?.email) {
      throw new Error('Email is required');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updateProfile(user, { displayName: user.displayName });

    await handleProfileUpdate({
      passwordLastChanged: new Date().toISOString(),
    });
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (!user) return;

    try {
      const { firestore } = await getFirebaseServices();
      const docRef = doc(firestore, 'users', user.uid);
      await updateDoc(docRef, { deleted: true });
      await deleteUser(user);
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: (theme) => (theme.palette.mode === 'light' ? gray[100] : gray[900]),
      }}
    >
      <StyledContainer maxWidth="xl">
        <Box mb={{ xs: 4, md: 6 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem' },
              fontWeight: 600,
              color: (theme) => (theme.palette.mode === 'light' ? gray[800] : '#FFFFFF'),
              mb: 1.5,
              letterSpacing: '-0.02em',
            }}
          >
            Settings
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.125rem',
              color: (theme) => (theme.palette.mode === 'light' ? gray[600] : gray[400]),
              letterSpacing: '-0.01em',
            }}
          >
            Manage your account settings and preferences
          </Typography>
        </Box>

        <StyledPaper elevation={0}>
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: '56px',
              '& .MuiTabs-flexContainer': {
                minHeight: '56px',
              },
              '& .MuiTab-root': {
                minHeight: '56px',
                py: 0,
              },
              '& .MuiTabs-scrollButtons': {
                width: 48,
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
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
            {profile && (
              <ProfileSection
                profile={profile}
                onSave={handleProfileUpdate}
                onPhotoChange={handlePhotoChange}
                StyledTextField={StyledTextField}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {profile && (
              <AccountSection
                profile={profile}
                onChangePassword={handlePasswordChange}
                onDeleteAccount={handleDeleteAccount}
                StyledTextField={StyledTextField}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {profile && (
              <NotificationsSection profile={profile} onUpdate={handleProfileUpdate} />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {profile && (
              <PrivacySection profile={profile} onUpdate={handleProfileUpdate} />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            {profile && (
              <PreferencesSection
                profile={profile}
                onUpdate={handleProfileUpdate}
                StyledTextField={StyledTextField}
              />
            )}
          </TabPanel>
        </StyledPaper>

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
              borderRadius: '12px',
              py: 1.5,
              px: 2.5,
              boxShadow:
                '0px 8px 24px -4px rgba(16, 24, 40, 0.12), 0px 16px 32px -4px rgba(16, 24, 40, 0.16)',
            },
          }}
        />
      </StyledContainer>
    </Box>
  );
};

export default SettingsPage;
