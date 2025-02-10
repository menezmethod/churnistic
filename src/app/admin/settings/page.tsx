'use client';

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

interface SystemSettings {
  maintenance_mode: boolean;
  rate_limits: {
    max_requests: number;
    window_ms: number;
  };
  notifications: {
    enabled: boolean;
    batch_size: number;
  };
  scraper: {
    max_concurrency: number;
    timeout_secs: number;
  };
  features: {
    analytics_enabled: boolean;
    ai_functions_enabled: boolean;
    real_time_enabled: boolean;
  };
}

export default function SystemSettingsPage() {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    rate_limits: {
      max_requests: 50,
      window_ms: 60000,
    },
    notifications: {
      enabled: true,
      batch_size: 100,
    },
    scraper: {
      max_concurrency: 2,
      timeout_secs: 30,
    },
    features: {
      analytics_enabled: true,
      ai_functions_enabled: true,
      real_time_enabled: true,
    },
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setTimeout(() => setError(null), 5000);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access system settings.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system-wide settings and features
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenance_mode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenance_mode: e.target.checked,
                      })
                    }
                  />
                }
                label="Maintenance Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                When enabled, the system will be in maintenance mode and users will see a
                maintenance page.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Rate Limits */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate Limits
              </Typography>
              <Stack spacing={3}>
                <TextField
                  label="Max Requests"
                  type="number"
                  value={settings.rate_limits.max_requests}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rate_limits: {
                        ...settings.rate_limits,
                        max_requests: parseInt(e.target.value),
                      },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Window (ms)"
                  type="number"
                  value={settings.rate_limits.window_ms}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rate_limits: {
                        ...settings.rate_limits,
                        window_ms: parseInt(e.target.value),
                      },
                    })
                  }
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Enable Notifications"
                />
                <TextField
                  label="Batch Size"
                  type="number"
                  value={settings.notifications.batch_size}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        batch_size: parseInt(e.target.value),
                      },
                    })
                  }
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Scraper Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scraper Settings
              </Typography>
              <Stack spacing={3}>
                <TextField
                  label="Max Concurrency"
                  type="number"
                  value={settings.scraper.max_concurrency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scraper: {
                        ...settings.scraper,
                        max_concurrency: parseInt(e.target.value),
                      },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Timeout (seconds)"
                  type="number"
                  value={settings.scraper.timeout_secs}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scraper: {
                        ...settings.scraper,
                        timeout_secs: parseInt(e.target.value),
                      },
                    })
                  }
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Flags */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature Flags
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.features.analytics_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            analytics_enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Analytics"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.features.ai_functions_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            ai_functions_enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="AI Functions"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.features.real_time_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          features: {
                            ...settings.features,
                            real_time_enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Real-time Updates"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
        {saved && <Chip label="Settings saved!" color="success" />}
        {error && <Chip label={error} color="error" />}
      </Box>
    </Container>
  );
}
