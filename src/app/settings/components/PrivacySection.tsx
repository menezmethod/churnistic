import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
} from '@mui/material';
import { useState } from 'react';

import type { UserProfile } from './types';

interface PrivacySectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function PrivacySection({ profile, onUpdate }: PrivacySectionProps) {
  const [isSaving, setIsSaving] = useState(false);

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
    <>
      <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>
        Privacy Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 4 }}
      >
        Control your privacy and data sharing preferences
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FormGroup>
          <Box mb={4}>
            <Typography
              variant="subtitle2"
              sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}
            >
              Profile Visibility
            </Typography>
            <Select
              fullWidth
              value={profile.privacy.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              disabled={isSaving}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}
            >
              {profile.privacy.profileVisibility === 'public'
                ? 'Your profile is visible to other users'
                : 'Your profile is only visible to you'}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={profile.privacy.showEmail}
                onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Show Email Address
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Allow other users to see your email address
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={profile.privacy.showActivity}
                onChange={(e) => handlePrivacyChange('showActivity', e.target.checked)}
                disabled={isSaving}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  Show Activity
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                >
                  Allow other users to see your recent activity
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
