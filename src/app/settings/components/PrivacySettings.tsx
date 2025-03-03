'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormControl,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

import { useSettings } from '@/lib/hooks/useSettings';

interface PrivacySettingsProps {
  user: User;
  supabase: SupabaseClient;
}

export default function PrivacySettings({}: PrivacySettingsProps) {
  const {
    settings,
    isLoading,
    isError,
    error,
    updatePrivacySettings,
    privacySettingsStatus,
    resetSettings,
  } = useSettings();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Error loading settings: {error?.message || 'Unknown error'}
      </Alert>
    );
  }

  const handlePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    updatePrivacySettings({ [name]: checked });
  };

  const handleProfileVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updatePrivacySettings({
      profileVisibility: event.target.value as 'public' | 'private',
    });
  };

  const handleResetPrivacySettings = () => {
    resetSettings(['privacy']);
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Privacy Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Control who can see your profile and activity
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Profile Visibility</FormLabel>
            <RadioGroup
              aria-label="profile-visibility"
              name="profileVisibility"
              value={settings.privacy.profileVisibility}
              onChange={handleProfileVisibilityChange}
            >
              <FormControlLabel
                value="public"
                control={<Radio disabled={privacySettingsStatus.isLoading} />}
                label="Public - Anyone can view your profile"
              />
              <FormControlLabel
                value="private"
                control={<Radio disabled={privacySettingsStatus.isLoading} />}
                label="Private - Only you can view your profile"
              />
            </RadioGroup>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showEmail}
                    onChange={handlePrivacyChange}
                    name="showEmail"
                    color="primary"
                    disabled={privacySettingsStatus.isLoading}
                  />
                }
                label="Show Email Address"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Allow other users to see your email address
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showActivity}
                    onChange={handlePrivacyChange}
                    name="showActivity"
                    color="primary"
                    disabled={privacySettingsStatus.isLoading}
                  />
                }
                label="Show Activity"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Allow other users to see your recent activity and contributions
              </Typography>
            </Grid>
          </Grid>

          {privacySettingsStatus.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating privacy settings:{' '}
              {privacySettingsStatus.error?.message || 'Unknown error'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage how your data is used and stored
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Button
            variant="outlined"
            color="primary"
            onClick={handleResetPrivacySettings}
            disabled={privacySettingsStatus.isLoading}
            sx={{ mr: 2 }}
          >
            Reset Privacy Settings
          </Button>

          <Button variant="outlined" color="error" disabled>
            Request Data Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cookies and Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage cookies and tracking preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" paragraph>
            We use cookies and similar technologies to provide, protect, and improve our
            services. You can manage your cookie preferences at any time.
          </Typography>

          <Button variant="outlined" disabled>
            Manage Cookie Preferences
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
