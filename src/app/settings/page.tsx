'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';

import AccountSettings from './components/AccountSettings';
import NotificationsSettings from './components/NotificationsSettings';
import PrivacySettings from './components/PrivacySettings';
import SecuritySettings from './components/SecuritySettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [value, setValue] = useState(0);
  const { user } = useAuth();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Card>
          <CardContent>
            <Typography>Please sign in to access your settings.</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="settings tabs"
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : undefined}
            allowScrollButtonsMobile
            sx={{ px: 2 }}
          >
            <Tab label="Account" {...a11yProps(0)} />
            <Tab label="Security" {...a11yProps(1)} />
            <Tab label="Notifications" {...a11yProps(2)} />
            <Tab label="Privacy" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <AccountSettings user={user} supabase={supabase} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <SecuritySettings user={user} supabase={supabase} />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <NotificationsSettings user={user} supabase={supabase} />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <PrivacySettings user={user} supabase={supabase} />
        </TabPanel>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danger Zone
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1">Delete Account</Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and all of your data. This action cannot
                be undone.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              >
                <Button variant="outlined" color="error">
                  Delete Account
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
