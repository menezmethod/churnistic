import { Box, Typography, Switch, FormControlLabel, FormGroup } from '@mui/material';
import { useState } from 'react';

import type { UserProfile } from './types';

interface NotificationsSectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function NotificationsSection({ profile, onUpdate }: NotificationsSectionProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleNotificationChange = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await onUpdate({
        notifications: {
          ...profile.notifications,
          [field]: value,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>
        Notification Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Choose which updates and alerts you want to receive
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={profile.notifications.creditCardAlerts}
                onChange={(e) =>
                  handleNotificationChange('creditCardAlerts', e.target.checked)
                }
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Credit Card Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Get notified about application deadlines, minimum spend requirements,
                  and bonus qualification status
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={profile.notifications.bankBonusAlerts}
                onChange={(e) =>
                  handleNotificationChange('bankBonusAlerts', e.target.checked)
                }
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Bank Bonus Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Receive updates about direct deposit requirements, minimum balance
                  alerts, and bonus payout timelines
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={profile.notifications.investmentAlerts}
                onChange={(e) =>
                  handleNotificationChange('investmentAlerts', e.target.checked)
                }
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Investment Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Stay informed about investment bonus opportunities, holding period
                  requirements, and transfer deadlines
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={profile.notifications.riskAlerts}
                onChange={(e) => handleNotificationChange('riskAlerts', e.target.checked)}
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Risk Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Get important alerts about credit score changes, application velocity
                  limits, and ChexSystems activity
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </FormGroup>
      </Box>
    </>
  );
}
