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
  Box,
  Divider,
} from '@mui/material';
import { useState } from 'react';

import { UserRole } from '@/lib/auth/types';

import type { User } from '../hooks/useUsers';

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
        photoURL: formData.avatarUrl ?? undefined,
        role: formData.role,
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
              Role
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value as string)}
              >
                <MenuItem value={UserRole.USER}>User</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              </Select>
            </FormControl>

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
