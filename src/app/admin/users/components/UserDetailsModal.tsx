import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Autocomplete,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useState } from 'react';

import { UserRole } from '@/lib/auth';

import type { User } from '../hooks/useUsers';

// Define available permissions
const AVAILABLE_PERMISSIONS = [
  'users.read',
  'users.write',
  'users.delete',
  'content.read',
  'content.write',
  'content.delete',
  'settings.read',
  'settings.write',
] as const;

interface UserDetailsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    user: User,
    data: {
      email?: string;
      displayName?: string;
      photoURL?: string;
      role?: string;
      permissions?: string[];
      isSuperAdmin?: boolean;
    }
  ) => Promise<void>;
}

export default function UserDetailsModal({
  open,
  user,
  onClose,
  onSave,
}: UserDetailsModalProps) {
  const [formData, setFormData] = useState<User | null>(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof User, value: string | boolean | string[]) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setLoading(true);
    try {
      await onSave(formData, {
        email: formData.email,
        displayName: formData.displayName ?? undefined,
        photoURL: formData.photoURL ?? undefined,
        role: formData.role,
        permissions: formData.permissions,
        isSuperAdmin: formData.isSuperAdmin,
      });
      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {formData.id ? 'Edit User' : 'Create User'} - {formData.email}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Basic Information */}
            <Typography variant="h6" color="primary">
              Basic Information
            </Typography>
            <TextField
              label="Display Name"
              value={formData.displayName ?? ''}
              onChange={(e) => handleChange('displayName', e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              required
              type="email"
            />

            <Divider sx={{ my: 2 }} />

            {/* Role and Permissions */}
            <Typography variant="h6" color="primary">
              Role & Permissions
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
              >
                <MenuItem value={UserRole.USER.toString()}>User</MenuItem>
                <MenuItem value={UserRole.ADMIN.toString()}>Admin</MenuItem>
                <MenuItem value={UserRole.CONTRIBUTOR.toString()}>Contributor</MenuItem>
                <MenuItem value={UserRole.SUPER_ADMIN.toString()}>Super Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData?.isSuperAdmin ?? false}
                  onChange={(e) => handleChange('isSuperAdmin', e.target.checked)}
                />
              }
              label="Super Admin"
            />

            <Autocomplete
              multiple
              options={AVAILABLE_PERMISSIONS}
              value={formData.permissions || []}
              onChange={(_e, newValue) => handleChange('permissions', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Permissions"
                  placeholder="Select permissions"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    size="small"
                  />
                ))
              }
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                * Super Admin users have access to all permissions regardless of their
                role
              </Typography>
            </Box>
          </Stack>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
