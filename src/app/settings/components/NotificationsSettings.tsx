'use client';

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

import { useSettings } from '@/lib/hooks/useSettings';

interface NotificationsSettingsProps {
  user: User;
  supabase: SupabaseClient;
}

export default function NotificationsSettings({}: NotificationsSettingsProps) {
  const {
    settings,
    isLoading,
    isError,
    error,
    updateNotificationSettings,
    updateEmailPreferences,
    notificationSettingsStatus,
    emailPreferencesStatus,
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

  const handleNotificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    updateNotificationSettings({ [name]: checked });
  };

  const handleEmailPreferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    updateEmailPreferences({ [name]: checked });
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage the emails you want to receive
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailPreferences.marketing}
                    onChange={handleEmailPreferenceChange}
                    name="marketing"
                    color="primary"
                    disabled={emailPreferencesStatus.isLoading}
                  />
                }
                label="Marketing emails"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive emails about new features, promotional offers, and updates
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailPreferences.security}
                    onChange={handleEmailPreferenceChange}
                    name="security"
                    color="primary"
                    disabled={emailPreferencesStatus.isLoading}
                  />
                }
                label="Security alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive emails about security concerns and suspicious activity
              </Typography>
            </Grid>
          </Grid>

          {emailPreferencesStatus.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating email preferences:{' '}
              {emailPreferencesStatus.error?.message || 'Unknown error'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Application Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure which notifications you receive in the application
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.creditCardAlerts}
                    onChange={handleNotificationChange}
                    name="creditCardAlerts"
                    color="primary"
                    disabled={notificationSettingsStatus.isLoading}
                  />
                }
                label="Credit Card Alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive notifications about new credit card opportunities
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.bankBonusAlerts}
                    onChange={handleNotificationChange}
                    name="bankBonusAlerts"
                    color="primary"
                    disabled={notificationSettingsStatus.isLoading}
                  />
                }
                label="Bank Bonus Alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive notifications about new bank account bonuses
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.investmentAlerts}
                    onChange={handleNotificationChange}
                    name="investmentAlerts"
                    color="primary"
                    disabled={notificationSettingsStatus.isLoading}
                  />
                }
                label="Investment Alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive notifications about new investment opportunities
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.riskAlerts}
                    onChange={handleNotificationChange}
                    name="riskAlerts"
                    color="primary"
                    disabled={notificationSettingsStatus.isLoading}
                  />
                }
                label="Risk Alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive notifications about potential risks and important updates
              </Typography>
            </Grid>
          </Grid>

          {notificationSettingsStatus.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating notification settings:{' '}
              {notificationSettingsStatus.error?.message || 'Unknown error'}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
