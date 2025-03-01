'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { useSettings } from '@/lib/hooks/useSettings';

interface AccountSettingsProps {
  user: User;
  supabase: any;
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const {
    settings,
    isLoading,
    isError,
    error,
    updateThemeSettings,
    toggleDarkMode,
    useSystemPreference,
    systemPreference,
    themeSettingsStatus
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

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeSettings({ theme: event.target.value as 'light' | 'dark' | 'system' });
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                value={user.email}
                disabled
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User ID"
                value={user.id}
                disabled
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Theme Settings
          </Typography>
          <FormControl component="fieldset">
            <FormLabel component="legend">Choose Theme</FormLabel>
            <RadioGroup
              aria-label="theme"
              name="theme"
              value={settings.preferences.theme}
              onChange={handleThemeChange}
            >
              <FormControlLabel value="light" control={<Radio />} label="Light" />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
              <FormControlLabel 
                value="system" 
                control={<Radio />} 
                label={`System (Currently ${systemPreference})`} 
              />
            </RadioGroup>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => toggleDarkMode()}
              disabled={themeSettingsStatus.isLoading}
            >
              {themeSettingsStatus.isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Toggle to ${settings.preferences.theme === 'dark' ? 'Light' : 'Dark'} Mode`
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={() => useSystemPreference()}
              disabled={themeSettingsStatus.isLoading || settings.preferences.theme === 'system'}
            >
              Use System Setting
            </Button>
          </Box>
          {themeSettingsStatus.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating theme: {themeSettingsStatus.error?.message || 'Unknown error'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Language & Regional Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <TextField
                  select
                  label="Language"
                  value={settings.preferences.language || 'en'}
                  SelectProps={{
                    native: true,
                  }}
                  disabled // Not implemented yet
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </TextField>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <TextField
                  select
                  label="Timezone"
                  value={settings.preferences.timezone || 'UTC'}
                  SelectProps={{
                    native: true,
                  }}
                  disabled // Not implemented yet
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </TextField>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
} 