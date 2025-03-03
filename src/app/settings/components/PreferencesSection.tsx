'use client';

import { WbSunny, DarkMode, SettingsSystemDaydreamOutlined } from '@mui/icons-material';
import {
  Box,
  Typography,
  FormControl,
  Stack,
  Button,
  useTheme as useMuiTheme,
  Divider,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  styled,
  SelectChangeEvent,
  TextFieldProps,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

import { useTheme } from '@/app/styles/theme/ThemeContext';
import { UserSettings, ThemeSettings } from '@/lib/hooks/useSettings';

interface PreferencesSectionProps {
  user: User;
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => Promise<void>;
  StyledTextField: React.ComponentType<TextFieldProps>;
}

// Create styled theme option buttons to match original design
const ThemeOptionButton = styled(Button)<{ selected: boolean }>(
  ({ theme, selected }) => ({
    minWidth: 120,
    backgroundColor: selected
      ? theme.palette.primary.main
      : theme.palette.mode === 'light'
        ? '#ffffff'
        : 'hsla(220, 30%, 6%, 0.8)',
    color: selected ? '#fff' : theme.palette.text.primary,
    border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: 8,
    padding: '12px 20px',
    textTransform: 'none',
    fontWeight: 500,
    transition: 'all 0.2s ease-in-out',
    boxShadow: selected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
    '&:hover': {
      backgroundColor: selected
        ? theme.palette.primary.dark
        : theme.palette.mode === 'light'
          ? 'rgba(0,0,0,0.03)'
          : 'rgba(255,255,255,0.05)',
      borderColor: selected ? theme.palette.primary.dark : theme.palette.primary.main,
      boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
      transform: 'translateY(-1px)',
    },
  })
);

export function PreferencesSection({
  settings,
  updateThemeSettings,
}: PreferencesSectionProps) {
  const muiTheme = useMuiTheme();
  const { mode, setMode, actualMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    theme: settings.preferences.theme || 'system',
    language: settings.preferences.language || 'en',
    timezone: settings.preferences.timezone || 'UTC',
  });
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(actualMode);

  // Set initial state based on settings
  useEffect(() => {
    // Make sure the form state is synced with the loaded settings
    setPreferences({
      theme: settings.preferences.theme || 'system',
      language: settings.preferences.language || 'en',
      timezone: settings.preferences.timezone || 'UTC',
    });

    console.log('🎨 [PreferencesSection] Initializing with settings:', {
      themePreference: settings.preferences.theme,
      currentMode: mode,
      actualMode,
      systemDetectedMode: window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    });
  }, [settings, mode, actualMode]);

  // Detect system preference
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check initial preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(darkModeMediaQuery.matches ? 'dark' : 'light');

    // Set up listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      const newPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newPreference);

      console.log('🎨 [PreferencesSection] System preference changed:', {
        newPreference,
        currentThemeSetting: preferences.theme,
      });
    };

    // Add listener
    darkModeMediaQuery.addEventListener('change', handleChange);

    // Clean up
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
    };
  }, [preferences.theme]);

  const applyTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Debug logging before theme change
    console.log('🔍 [THEME DEBUG] Apply theme requested:', {
      from: preferences.theme,
      to: newTheme,
      currentMode: mode,
      actualMode,
      systemPreference,
      currentBodyClass:
        typeof document !== 'undefined' ? document.body.className : 'unknown',
      currentHtmlClass:
        typeof document !== 'undefined' ? document.documentElement.className : 'unknown',
    });

    try {
      // Update the UI state immediately for feedback
      setPreferences((prev) => ({ ...prev, theme: newTheme }));

      // Apply the theme right away via the theme context
      setMode(newTheme);

      // Log after theme context update
      console.log('🔍 [THEME DEBUG] Applied theme via context:', {
        newTheme,
        systemPreference,
        bodyClasses:
          typeof document !== 'undefined' ? document.body.className : 'unknown',
        htmlClasses:
          typeof document !== 'undefined'
            ? document.documentElement.className
            : 'unknown',
      });

      // Then persist to database
      await updateThemeSettings({ theme: newTheme });

      // Log after database update
      console.log('✅ [THEME DEBUG] Theme saved to database:', {
        theme: newTheme,
        systemPreference,
      });

      setSuccess('Theme updated successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Final check to see if theme was properly applied
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          const computedBodyBg = window.getComputedStyle(document.body).backgroundColor;
          const computedTextColor = window.getComputedStyle(document.body).color;
          console.log('🔍 [THEME DEBUG] Final theme state check:', {
            theme: newTheme,
            actualMode,
            computedBodyBg,
            computedTextColor,
            currentMode: mode,
            bodyClasses: document.body.className,
            htmlClasses: document.documentElement.className,
          });
        }
      }, 200);
    } catch (err) {
      console.error('❌ [THEME DEBUG] Error updating theme:', err);
      setError((err as Error).message || 'Failed to update theme');

      // Revert preferences state on error
      setPreferences((prev) => ({ ...prev, theme: settings.preferences.theme }));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const newLanguage = event.target.value;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update state for immediate feedback
      setPreferences((prev) => ({ ...prev, language: newLanguage }));

      // Persist to database
      await updateThemeSettings({ language: newLanguage });
      setSuccess('Language updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating language:', err);
      setError((err as Error).message || 'Failed to update language');
      // Revert on error - ensure fallback to a valid string
      setPreferences((prev) => ({
        ...prev,
        language: settings.preferences.language || 'en',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = async (event: SelectChangeEvent) => {
    const newTimezone = event.target.value;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update state for immediate feedback
      setPreferences((prev) => ({ ...prev, timezone: newTimezone }));

      // Persist to database
      await updateThemeSettings({ timezone: newTimezone });
      setSuccess('Timezone updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating timezone:', err);
      setError((err as Error).message || 'Failed to update timezone');
      // Revert on error - ensure fallback to a valid string
      setPreferences((prev) => ({
        ...prev,
        timezone: settings.preferences.timezone || 'UTC',
      }));
    } finally {
      setLoading(false);
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
            color: muiTheme.palette.mode === 'light' ? 'text.primary' : '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          Preferences
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
          Customize your experience with personal preferences
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
            p: 3,
            borderRadius: 2,
            bgcolor:
              muiTheme.palette.mode === 'light'
                ? 'background.paper'
                : 'hsl(220, 35%, 3%)',
            border: `1px solid ${muiTheme.palette.mode === 'light' ? 'hsl(220, 20%, 88%)' : 'hsl(220, 20%, 25%)'}`,
          }}
        >
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Theme
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
              <ThemeOptionButton
                selected={preferences.theme === 'light'}
                onClick={() => applyTheme('light')}
                disabled={loading}
                startIcon={<WbSunny fontSize="small" />}
              >
                Light
              </ThemeOptionButton>

              <ThemeOptionButton
                selected={preferences.theme === 'dark'}
                onClick={() => applyTheme('dark')}
                disabled={loading}
                startIcon={<DarkMode fontSize="small" />}
              >
                Dark
              </ThemeOptionButton>

              <ThemeOptionButton
                selected={preferences.theme === 'system'}
                onClick={() => applyTheme('system')}
                disabled={loading}
                startIcon={<SettingsSystemDaydreamOutlined fontSize="small" />}
              >
                System
              </ThemeOptionButton>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Language
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={preferences.language}
                label="Language"
                onChange={(e: SelectChangeEvent) => handleLanguageChange(e)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="pt">Portuguese</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Timezone
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="timezone-select-label">Timezone</InputLabel>
              <Select
                labelId="timezone-select-label"
                id="timezone-select"
                value={preferences.timezone}
                label="Timezone"
                onChange={handleTimezoneChange}
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                <MenuItem value="Europe/London">London</MenuItem>
                <MenuItem value="Europe/Paris">Paris</MenuItem>
                <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
                <MenuItem value="Australia/Sydney">Sydney</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
