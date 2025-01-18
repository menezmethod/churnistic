import { Box, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { useState } from 'react';

import { useTheme } from '@/styles/theme/ThemeContext';

import type { PreferencesSectionProps } from './types';

const gray = {
  200: 'hsl(220, 20%, 88%)',
  700: 'hsl(220, 20%, 25%)',
  900: 'hsl(220, 35%, 3%)',
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PreferencesSection({ profile, onUpdate }: PreferencesSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { setMode } = useTheme();

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
    <>
      <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>
        Preferences
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Customize your experience with personal preferences
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 2 }}
          >
            Theme
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['light', 'dark', 'system'].map((option) => (
              <Button
                key={option}
                variant={profile.preferences.theme === option ? 'contained' : 'outlined'}
                onClick={() => {
                  void handlePreferenceChange('theme', option);
                }}
                sx={{
                  textTransform: 'capitalize',
                  px: 3,
                  py: 1,
                  ...(profile.preferences.theme === option
                    ? {
                        bgcolor: '#0B5CFF',
                        '&:hover': {
                          bgcolor: '#0B4ECC',
                        },
                      }
                    : {
                        color: 'text.primary',
                        borderColor: '#D0D5DD',
                        '&:hover': {
                          borderColor: '#98A2B3',
                        },
                      }),
                }}
              >
                {option}
              </Button>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 2 }}
          >
            Language
          </Typography>
          <FormControl fullWidth>
            <Select
              value={profile.preferences.language}
              onChange={(e) => {
                void handlePreferenceChange('language', e.target.value);
              }}
              disabled={isSaving}
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) =>
                    theme.palette.mode === 'light' ? gray[200] : gray[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0B5CFF',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0B5CFF',
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
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 2 }}
          >
            Timezone
          </Typography>
          <FormControl fullWidth>
            <Select
              value={profile.preferences.timezone}
              onChange={(e) => {
                void handlePreferenceChange('timezone', e.target.value);
              }}
              disabled={isSaving}
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? '#FFFFFF' : gray[900],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) =>
                    theme.palette.mode === 'light' ? gray[200] : gray[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0B5CFF',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0B5CFF',
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
        </Box>
      </Box>
    </>
  );
}
