import { Info as InfoIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  Fade,
  Stack,
  useTheme,
  Tooltip,
  IconButton,
  FormControl,
} from '@mui/material';
import { useState } from 'react';

import type { UserProfile } from './types';

interface PrivacySectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function PrivacySection({ profile, onUpdate }: PrivacySectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();

  const handlePrivacyChange = async (field: string, value: string | boolean) => {
    setIsSaving(true);
    try {
      await onUpdate({
        privacy: {
          ...profile.privacy,
          [field]: value,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

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
            Privacy Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Control your privacy and data sharing preferences
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
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Profile Visibility
                    </Typography>
                    <Tooltip
                      title="Choose who can see your profile information"
                      placement="top"
                    >
                      <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <Select
                      value={profile.privacy.profileVisibility}
                      onChange={(e) =>
                        handlePrivacyChange('profileVisibility', e.target.value)
                      }
                      disabled={isSaving}
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.divider,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {profile.privacy.profileVisibility === 'public'
                      ? 'Your profile is visible to other users'
                      : 'Your profile is only visible to you'}
                  </Typography>
                </Box>

                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.privacy.showEmail}
                        onChange={(e) =>
                          handlePrivacyChange('showEmail', e.target.checked)
                        }
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
                      <Stack spacing={0.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                        >
                          Show Email Address
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Allow other users to see your email address
                        </Typography>
                      </Stack>
                    }
                    sx={{ m: 0, alignItems: 'center' }}
                  />
                </Box>

                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.privacy.showActivity}
                        onChange={(e) =>
                          handlePrivacyChange('showActivity', e.target.checked)
                        }
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
                      <Stack spacing={0.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                        >
                          Show Activity
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Allow other users to see your recent activity
                        </Typography>
                      </Stack>
                    }
                    sx={{ m: 0, alignItems: 'center' }}
                  />
                </Box>
              </Stack>
            </FormGroup>
          </Stack>
        </Box>
      </Stack>
    </Fade>
  );
}
