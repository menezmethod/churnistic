import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { useState } from 'react';

import type { ProfileSectionProps } from './types';

export function ProfileSection({
  profile,
  onSave,
  onPhotoChange,
  StyledTextField,
}: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(
    profile?.customDisplayName?.split(' ')[0] || ''
  );
  const [lastName, setLastName] = useState(
    profile?.customDisplayName?.split(' ')[1] || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await onSave({
        ...profile,
        customDisplayName: `${firstName} ${lastName}`.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const TextField = StyledTextField || 'div';

  return (
    <>
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: '30px',
          fontWeight: 600,
          mb: 2,
          color: (theme) =>
            theme.palette.mode === 'dark' ? 'hsl(0, 0%, 100%)' : '#101828',
        }}
      >
        Profile
      </Typography>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <Box mb={4}>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}
          >
            Your Photo{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={profile?.photoURL || undefined}
              alt={profile?.customDisplayName || 'User avatar'}
              sx={{
                width: 64,
                height: 64,
                border: '4px solid #FFFFFF',
                boxShadow:
                  '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
              }}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              component="label"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                color: 'text.primary',
                borderColor: '#D0D5DD',
                '&:hover': {
                  borderColor: '#0B5CFF',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Change Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPhotoChange(file);
                }}
              />
            </Button>
          </Box>
        </Box>

        <Box mb={4}>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}
          >
            Name{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              fullWidth
              placeholder="First name"
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFirstName(e.target.value)
              }
            />
            <TextField
              fullWidth
              placeholder="Last name"
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLastName(e.target.value)
              }
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            pt: 4,
            mt: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.primary',
              borderColor: '#D0D5DD',
              px: 2.5,
              py: 1.25,
              '&:hover': {
                borderColor: '#0B5CFF',
                backgroundColor: 'transparent',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 2.5,
              py: 1.25,
              bgcolor: '#0B5CFF',
              '&:hover': {
                bgcolor: '#0B4ECC',
              },
              '&:disabled': {
                bgcolor: '#0B5CFF',
                opacity: 0.7,
              },
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
