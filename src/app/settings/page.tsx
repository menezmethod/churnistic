'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface UserSettings {
  displayName: string;
  email: string;
  photoURL: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    displayName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    photoURL: user?.user_metadata?.avatar_url || '',
    notifications: {
      email: true,
      push: true,
    },
    preferences: {
      theme: 'system',
      language: 'en',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const notifications = (data.notifications as {
            email: boolean;
            push: boolean;
          }) || {
            email: true,
            push: true,
          };
          const preferences = (data.preferences as {
            theme: 'light' | 'dark' | 'system';
            language: string;
          }) || {
            theme: 'system' as const,
            language: 'en',
          };

          setSettings({
            ...settings,
            notifications,
            preferences,
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      }
    };

    void loadSettings();
  }, [settings, user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Update user profile
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: settings.displayName,
          avatar_url: settings.photoURL,
        },
      });

      if (profileError) throw profileError;

      // Update user preferences
      const { error: preferencesError } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        notifications: settings.notifications,
        preferences: settings.preferences,
      });

      if (preferencesError) throw preferencesError;

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      try {
        setLoading(true);

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        setSettings({ ...settings, photoURL: publicUrl });
      } catch (err) {
        console.error('Error uploading photo:', err);
        setError('Failed to upload photo');
      } finally {
        setLoading(false);
      }
    },
    [user, settings]
  );

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Please sign in to access settings</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack spacing={2} alignItems="center">
                  <Avatar
                    src={settings.photoURL}
                    alt={settings.displayName}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Button variant="outlined" component="label" disabled={loading}>
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <TextField
                    label="Display Name"
                    value={settings.displayName}
                    onChange={(e) =>
                      setSettings({ ...settings, displayName: e.target.value })
                    }
                    fullWidth
                  />
                  <TextField label="Email" value={settings.email} disabled fullWidth />

                  <Typography variant="h6">Notifications</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              email: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              push: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="Push Notifications"
                  />

                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSave} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
