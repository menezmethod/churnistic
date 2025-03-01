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
import { JSX, useCallback, useEffect, useState } from 'react';

import { useTheme } from '@/app/styles/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useSettings } from '@/lib/hooks/useSettings';

import { AccountSection } from './components/AccountSection';
import { NotificationsSection } from './components/NotificationsSection';
import { PreferencesSection } from './components/PreferencesSection';
import { PrivacySection } from './components/PrivacySection';
import { ProfileSection } from './components/ProfileSection';

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
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  
  const {
    settings,
    isLoading,
    isError,
    updateThemeSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    updateEmailPreferences,
    updateAllSettings,
    systemPreference,
  } = useSettings();

  // Detect if we need to initialize settings with the current theme
  useEffect(() => {
    if (settings && !settings.preferences?.theme) {
      // If no theme is set, initialize it with the current mode
      console.log('🎨 [SettingsPage] Initializing theme settings with mode:', mode);
      updateThemeSettings({ theme: mode === 'system' ? 'system' : mode as 'light' | 'dark' })
        .catch(err => console.error('Failed to initialize theme settings:', err));
    }
  }, [settings, mode, updateThemeSettings]);

  // Sync theme mode from settings whenever settings change - make it more direct
  useEffect(() => {
    if (settings?.preferences?.theme) {
      const themeToApply = settings.preferences.theme === 'system' 
        ? systemPreference 
        : settings.preferences.theme;
        
      console.log('🎨 [SettingsPage] Syncing theme from settings:', {
        settingsTheme: settings.preferences.theme,
        systemPreference,
        themeToApply,
        currentMode: mode
      });
      
      // Direct, forced theme application to ensure it takes effect
      if (themeToApply !== mode) {
        console.log('🎨 [SettingsPage] Forcing theme change to:', themeToApply);
        setMode(themeToApply);
        
        // Apply a CSS class to the document root for immediate visual feedback
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        document.documentElement.classList.add(`${themeToApply}-theme`);
      }
    }
  }, [settings?.preferences?.theme, systemPreference, mode, setMode]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleProfileUpdate = async (updates: any): Promise<void> => {
    try {
      await updateAllSettings(updates);
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

  const handleCloseSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
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
          </Box>
          <StyledPaper elevation={0}>
            <Box p={4}>
              <Typography>Please sign in to access your settings.</Typography>
            </Box>
          </StyledPaper>
        </StyledContainer>
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
            {settings && (
              <ProfileSection
                user={user}
                settings={settings}
                onSave={handleProfileUpdate}
                StyledTextField={StyledTextField}
                supabase={supabase}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {settings && (
              <AccountSection
                user={user}
                settings={settings}
                supabase={supabase}
                StyledTextField={StyledTextField}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {settings && (
              <NotificationsSection 
                user={user}
                settings={settings} 
                onUpdate={handleProfileUpdate} 
                updateEmailPreferences={updateEmailPreferences} 
                updateNotificationSettings={updateNotificationSettings}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {settings && (
              <PrivacySection 
                user={user}
                settings={settings} 
                onUpdate={handleProfileUpdate}
                updatePrivacySettings={updatePrivacySettings}
              />
            )}
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            {settings && (
              <PreferencesSection
                user={user}
                settings={settings}
                onUpdate={handleProfileUpdate}
                updateThemeSettings={updateThemeSettings}
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
