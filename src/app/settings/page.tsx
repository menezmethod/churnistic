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
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase/config';

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

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
  borderRadius: '12px',
  border: '1px solid',
  borderColor: theme.palette.mode === 'light' ? gray[200] : gray[700],
  overflow: 'hidden',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  maxWidth: '1128px',
  padding: '32px',
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
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

  const handleProfileUpdate = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !profile) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

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
    if (!user || !profile) {
      setSnackbar({
        open: true,
        message: 'Please sign in to upload a photo',
        severity: 'error',
      });
      return;
    }

    try {
      const storageRef = ref(storage, `users/${user.uid}/profile-photo`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await handleProfileUpdate({ photoURL });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to upload photo',
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
      const docRef = doc(db, 'users', user.uid);
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
        bgcolor: (theme) => (theme.palette.mode === 'light' ? '#FFFFFF' : gray[900]),
      }}
    >
      <StyledContainer maxWidth={false}>
        <StyledPaper elevation={0}>
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
      </StyledContainer>

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
