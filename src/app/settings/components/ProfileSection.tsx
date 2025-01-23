import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Fade,
  CircularProgress,
  Stack,
  useTheme,
  Divider,
} from '@mui/material';
import { useState } from 'react';

import type { ProfileSectionProps } from './types';

export function ProfileSection({
  profile,
  onSave,
  onPhotoChange,
  StyledTextField,
}: ProfileSectionProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    firstName: profile?.customDisplayName?.split(' ')[0] || '',
    lastName: profile?.customDisplayName?.split(' ')[1] || '',
  });
  const [loading, setLoading] = useState({
    save: false,
    upload: false,
  });
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading((prev) => ({ ...prev, save: true }));
    try {
      await onSave({
        ...profile,
        customDisplayName: `${formData.firstName} ${formData.lastName}`.trim(),
      });
      setIsDirty(false);
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setLoading((prev) => ({ ...prev, upload: true }));
    try {
      await onPhotoChange(file);
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  const handleInputChange = (field: 'firstName' | 'lastName', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setFormData({
      firstName: profile?.customDisplayName?.split(' ')[0] || '',
      lastName: profile?.customDisplayName?.split(' ')[1] || '',
    });
    setIsDirty(false);
  };

  const TextField = StyledTextField || 'div';

  return (
    <Fade in timeout={300}>
      <Box component="form" onSubmit={handleSave}>
        <Stack spacing={2.5}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 600,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
            }}
          >
            Profile Settings
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={profile?.photoURL || undefined}
                    alt={profile?.customDisplayName || 'Profile photo'}
                    sx={{
                      width: 72,
                      height: 72,
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: theme.shadows[1],
                    }}
                  />
                  {loading.upload && (
                    <CircularProgress
                      size={72}
                      thickness={2}
                      sx={{ position: 'absolute', top: 0, left: 0 }}
                    />
                  )}
                </Box>

                <Stack spacing={0.5} flex={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Profile Photo
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={loading.upload}
                    startIcon={<CloudUploadIcon />}
                    size="small"
                    sx={{
                      py: 1,
                      px: 2,
                      maxWidth: 'fit-content',
                      borderRadius: 1,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                    }}
                  >
                    {loading.upload ? 'Uploading...' : 'Change Photo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handlePhotoUpload(file);
                      }}
                    />
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Personal Information
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('firstName', e.target.value)
                    }
                  />
                  <TextField
                    fullWidth
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('lastName', e.target.value)
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              disabled={loading.save || !isDirty}
              onClick={handleReset}
              size="small"
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading.save || !isDirty}
              size="small"
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.875rem',
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading.save ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Fade>
  );
}
