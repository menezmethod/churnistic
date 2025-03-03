'use client';

import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Fade,
  CircularProgress,
  Stack,
  Divider,
  useTheme,
  Alert,
  TextFieldProps,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

import { UserSettings } from '@/lib/hooks/useSettings';

interface ProfileSectionProps {
  user: User;
  settings: UserSettings;
  supabase: SupabaseClient;
  onSave: (updates: {
    firstName?: string;
    lastName?: string;
    avatar_url?: string;
  }) => Promise<void>;
  StyledTextField: React.ComponentType<TextFieldProps>;
}

export function ProfileSection({
  user,
  supabase,
  onSave,
  StyledTextField,
}: ProfileSectionProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
  });
  const [loading, setLoading] = useState({
    save: false,
    upload: false,
    init: true,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      try {
        console.log('Fetching user data for ID:', user.id);

        // Fetch from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('custom_display_name, display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          // If the user doesn't exist yet in the users table, we need to insert them
          if (userError.code === 'PGRST116') {
            // No rows found
            console.log('User not found in database, creating record...');

            // Extract display name from user object if available
            let displayName = '';
            if (user.user_metadata?.full_name) {
              displayName = user.user_metadata.full_name;
            } else if (user.user_metadata?.name) {
              displayName = user.user_metadata.name;
            } else {
              // Use email as fallback (excluding domain part)
              displayName = user.email ? user.email.split('@')[0] : '';
            }

            // Extract avatar URL if available in user metadata
            const avatarUrl = user.user_metadata?.avatar_url || null;

            // Create the user record
            const { data: newUserData, error: createError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                display_name: displayName,
                custom_display_name: displayName,
                avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                old_id: user.id, // Ensure this field is populated
              })
              .select('custom_display_name, display_name, avatar_url')
              .single();

            if (createError) {
              console.error('Error creating user record:', createError);
              setError(`Failed to create user record: ${createError.message}`);
              return;
            }

            // Use the new user data
            if (newUserData) {
              // Get the display name from custom_display_name or display_name
              const newDisplayName =
                newUserData.custom_display_name || newUserData.display_name || '';

              // Split display name into first and last name
              const nameParts = newDisplayName.split(' ');
              setFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                fullName: newDisplayName,
              });
              setPhotoURL(newUserData.avatar_url);
              console.log('Created new user record:', newUserData);
            }
          } else {
            setError(`Failed to load user data: ${userError.message}`);
            return;
          }
        }

        if (userData) {
          console.log('Found user data:', userData);

          // Get the display name from custom_display_name or display_name
          const displayName = userData.custom_display_name || userData.display_name || '';

          // Split display name into first and last name
          const nameParts = displayName.split(' ');
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            fullName: displayName,
          });
          setPhotoURL(userData.avatar_url);
        }
      } catch (err) {
        console.error('Error in user data management:', err);
        setError('Failed to initialize user data. Please try again later.');
      } finally {
        setLoading((prev) => ({ ...prev, init: false }));
      }
    }

    if (user) {
      fetchUserData();
    }
  }, [user, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading((prev) => ({ ...prev, save: true }));
    setError(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          custom_display_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      // Update local state
      setFormData((prev) => ({ ...prev, fullName }));
      setIsDirty(false);

      // Call the parent component's onSave function
      await onSave({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setError((err as Error).message || 'Failed to save profile');
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setLoading((prev) => ({ ...prev, upload: true }));
    setError(null);

    try {
      // Create a unique file path for the user's avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
      }

      // Get the public URL for the file
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to update avatar: ${updateError.message}`);
      }

      // Update local state
      setPhotoURL(publicUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError((err as Error).message || 'Failed to upload photo');
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  const handleInputChange = (field: 'firstName' | 'lastName', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    const nameParts = (formData.fullName || '').split(' ');
    setFormData((prev) => ({
      ...prev,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    }));
    setIsDirty(false);
  };

  // Show loading state during initialization
  if (loading.init) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <Box component="form" onSubmit={handleSave}>
        <Stack spacing={2.5}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 600,
              color: theme.palette.mode === 'light' ? 'text.primary' : '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Profile Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor:
                theme.palette.mode === 'light' ? 'background.paper' : 'hsl(220, 35%, 3%)',
              border: `1px solid ${theme.palette.mode === 'light' ? 'hsl(220, 20%, 88%)' : 'hsl(220, 20%, 25%)'}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={photoURL || undefined}
                    alt={formData.fullName || user.email || 'Profile photo'}
                    sx={{
                      width: 72,
                      height: 72,
                      border: `3px solid ${theme.palette.mode === 'light' ? 'white' : 'hsl(220, 35%, 3%)'}`,
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
                  <StyledTextField
                    fullWidth
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('firstName', e.target.value)
                    }
                  />
                  <StyledTextField
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
