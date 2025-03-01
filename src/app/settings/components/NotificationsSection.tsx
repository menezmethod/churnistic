'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { EmailPreferences, NotificationSettings, UserSettings } from '@/lib/hooks/useSettings';

interface NotificationsSectionProps {
  user: User;
  settings: UserSettings;
  onUpdate: (updates: any) => Promise<void>;
  updateEmailPreferences: (settings: Partial<EmailPreferences>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
}

export function NotificationsSection({
  user,
  settings,
  onUpdate,
  updateEmailPreferences,
  updateNotificationSettings,
}: NotificationsSectionProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailPreferencesChange = async (key: keyof EmailPreferences) => {
    setLoading(key);
    setError(null);
    setSuccess(null);
    
    try {
      const newValue = !settings.emailPreferences[key];
      await updateEmailPreferences({ [key]: newValue });
      setSuccess(`Email preferences updated successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating email preferences:', err);
      setError((err as Error).message || 'Failed to update email preferences');
    } finally {
      setLoading(null);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    setLoading(key);
    setError(null);
    setSuccess(null);
    
    try {
      const newValue = !settings.notifications[key];
      await updateNotificationSettings({ [key]: newValue });
      setSuccess(`Notification settings updated successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError((err as Error).message || 'Failed to update notification settings');
    } finally {
      setLoading(null);
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
            color: theme.palette.mode === 'light' ? 'text.primary' : '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          Notification Settings
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
            bgcolor: theme.palette.mode === 'light' ? 'background.paper' : 'hsl(220, 35%, 3%)',
            border: `1px solid ${theme.palette.mode === 'light' ? 'hsl(220, 20%, 88%)' : 'hsl(220, 20%, 25%)'}`,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Email Notifications
            </Typography>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailPreferences.marketing}
                    onChange={() => handleEmailPreferencesChange('marketing')}
                    disabled={loading === 'marketing'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Marketing emails</Typography>
                    {loading === 'marketing' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Receive emails about new features, offers, and updates
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailPreferences.security}
                    onChange={() => handleEmailPreferencesChange('security')}
                    disabled={loading === 'security'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Security alerts</Typography>
                    {loading === 'security' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Receive emails for important security updates and account activity
              </Typography>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              App Notifications
            </Typography>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.creditCardAlerts}
                    onChange={() => handleNotificationChange('creditCardAlerts')}
                    disabled={loading === 'creditCardAlerts'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Credit Card Alerts</Typography>
                    {loading === 'creditCardAlerts' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Get notified about new credit card offers and deal alerts
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.bankBonusAlerts}
                    onChange={() => handleNotificationChange('bankBonusAlerts')}
                    disabled={loading === 'bankBonusAlerts'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Bank Bonus Alerts</Typography>
                    {loading === 'bankBonusAlerts' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Get notified about new bank account bonuses and promotions
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.investmentAlerts}
                    onChange={() => handleNotificationChange('investmentAlerts')}
                    disabled={loading === 'investmentAlerts'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Investment Alerts</Typography>
                    {loading === 'investmentAlerts' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Get notified about important investment opportunities and changes
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.riskAlerts}
                    onChange={() => handleNotificationChange('riskAlerts')}
                    disabled={loading === 'riskAlerts'}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Risk Alerts</Typography>
                    {loading === 'riskAlerts' && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary">
                Get notified about potential risks to your financial accounts
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
