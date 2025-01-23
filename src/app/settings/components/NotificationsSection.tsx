import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  TrendingUp as InvestmentIcon,
  Warning as RiskIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Fade,
  Stack,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import type { UserProfile } from './types';

interface NotificationsSectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function NotificationsSection({ profile, onUpdate }: NotificationsSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();

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

  const notificationItems = [
    {
      id: 'creditCardAlerts',
      icon: CreditCardIcon,
      title: 'Credit Card Alerts',
      description:
        'Get notified about application deadlines, minimum spend requirements, and bonus qualification status',
      value: profile.notifications.creditCardAlerts,
    },
    {
      id: 'bankBonusAlerts',
      icon: BankIcon,
      title: 'Bank Bonus Alerts',
      description:
        'Receive updates about direct deposit requirements, minimum balance alerts, and bonus payout timelines',
      value: profile.notifications.bankBonusAlerts,
    },
    {
      id: 'investmentAlerts',
      icon: InvestmentIcon,
      title: 'Investment Alerts',
      description:
        'Stay informed about investment bonus opportunities, holding period requirements, and transfer deadlines',
      value: profile.notifications.investmentAlerts,
    },
    {
      id: 'riskAlerts',
      icon: RiskIcon,
      title: 'Risk Alerts',
      description:
        'Get important alerts about credit score changes, application velocity limits, and ChexSystems activity',
      value: profile.notifications.riskAlerts,
    },
  ];

  return (
    <Fade in timeout={300}>
      <Stack spacing={2.5}>
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 600,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Notification Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Choose which updates and alerts you want to receive
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2}>
            <FormGroup>
              {notificationItems.map(({ id, icon: Icon, title, description, value }) => (
                <Box
                  key={id}
                  component="label"
                  sx={{
                    display: 'block',
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: value ? `${theme.palette.primary.main}08` : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => handleNotificationChange(id, e.target.checked)}
                        disabled={isSaving}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: `${theme.palette.primary.main}14`,
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            bgcolor: theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={2}>
                        <Icon
                          sx={{
                            fontSize: '1.25rem',
                            color: value
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            mt: 0.25,
                          }}
                        />
                        <Stack spacing={0.5}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                          >
                            {title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              lineHeight: 1.4,
                            }}
                          >
                            {description}
                          </Typography>
                        </Stack>
                      </Stack>
                    }
                    sx={{
                      m: 0,
                      width: '100%',
                      alignItems: 'center',
                      '& .MuiFormControlLabel-label': {
                        flex: 1,
                      },
                    }}
                  />
                </Box>
              ))}
            </FormGroup>
          </Stack>
        </Box>
      </Stack>
    </Fade>
  );
}
