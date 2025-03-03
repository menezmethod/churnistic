'use client';

import {
  Box,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Divider,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { useState } from 'react';

import { PrivacySettings, UserSettings } from '@/lib/hooks/useSettings';

interface PrivacySectionProps {
  user: User;
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
}

export function PrivacySection({ settings, updatePrivacySettings }: PrivacySectionProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePrivacyChange = async (
    key: keyof PrivacySettings,
    value: boolean | 'public' | 'private'
  ) => {
    setLoading(key);
    setError(null);
    setSuccess(null);

    try {
      await updatePrivacySettings({ [key]: value });
      setSuccess('Privacy settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError((err as Error).message || 'Failed to update privacy settings');
    } finally {
      setLoading(null);
    }
  };

  const handleTogglePrivacy = async (key: keyof PrivacySettings) => {
    if (key === 'profileVisibility') return;

    const newValue = !settings.privacy[key];
    await handlePrivacyChange(key, newValue);
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
          Privacy Settings
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
            bgcolor:
              theme.palette.mode === 'light' ? 'background.paper' : 'hsl(220, 35%, 3%)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'hsl(220, 20%, 88%)' : 'hsl(220, 20%, 25%)'}`,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Profile Visibility
            </Typography>

            <FormControl component="fieldset">
              <FormLabel component="legend">Who can see your profile</FormLabel>
              <RadioGroup
                aria-label="profile-visibility"
                name="profileVisibility"
                value={settings.privacy.profileVisibility}
                onChange={(e) =>
                  handlePrivacyChange(
                    'profileVisibility',
                    e.target.value as 'public' | 'private'
                  )
                }
              >
                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">Public</Typography>
                      {loading === 'profileVisibility' && <CircularProgress size={16} />}
                    </Stack>
                  }
                />
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label={<Typography variant="body2">Private</Typography>}
                />
              </RadioGroup>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              {settings.privacy.profileVisibility === 'public'
                ? 'Your profile is visible to everyone'
                : 'Your profile is only visible to you'}
            </Typography>

            <Divider />

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showEmail}
                    onChange={() => handleTogglePrivacy('showEmail')}
                    disabled={loading === 'showEmail'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Show Email Address</Typography>
                    {loading === 'showEmail' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Allow others to see your email address on your profile
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showActivity}
                    onChange={() => handleTogglePrivacy('showActivity')}
                    disabled={loading === 'showActivity'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Activity Visibility</Typography>
                    {loading === 'showActivity' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Allow others to see your recent activity on the platform
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
