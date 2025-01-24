import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  Stack,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useState } from 'react';

import { useTheme } from '@/app/styles/theme/ThemeContext';

import type { PreferencesSectionProps } from './types';

export function PreferencesSection({ profile, onUpdate }: PreferencesSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { setMode } = useTheme();
  const theme = useMuiTheme();

  const handlePreferenceChange = async (key: string, value: string): Promise<void> => {
    setIsSaving(true);
    try {
      if (key === 'theme') {
        setMode(value as 'light' | 'dark' | 'system');
      }
      await onUpdate({
        preferences: {
          ...profile.preferences,
          [key]: value,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
          Preferences
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}
        >
          Customize your experience with personal preferences
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
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Theme
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {['light', 'dark', 'system'].map((option) => (
                <Button
                  key={option}
                  variant={
                    profile.preferences.theme === option ? 'contained' : 'outlined'
                  }
                  onClick={() => void handlePreferenceChange('theme', option)}
                  disabled={isSaving}
                  size="small"
                  sx={{
                    minWidth: 100,
                    py: 1,
                    textTransform: 'capitalize',
                    ...(profile.preferences.theme === option
                      ? {
                          bgcolor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }
                      : {
                          color: theme.palette.text.primary,
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor:
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.04)'
                                : 'rgba(255, 255, 255, 0.04)',
                          },
                        }),
                  }}
                >
                  {option}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Language
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={profile.preferences.language}
                onChange={(e) => void handlePreferenceChange('language', e.target.value)}
                disabled={true}
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
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="it">Italian</MenuItem>
                <MenuItem value="pt">Portuguese</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Timezone
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={profile.preferences.timezone}
                onChange={(e) => void handlePreferenceChange('timezone', e.target.value)}
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
                {Intl.supportedValuesOf('timeZone').map((timezone) => (
                  <MenuItem key={timezone} value={timezone}>
                    {timezone.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
