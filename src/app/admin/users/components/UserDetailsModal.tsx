import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
  Typography,
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
    data: { email?: string; displayName?: string; photoURL?: string }
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

  const handleChange = (field: keyof User, value: string | boolean) => {
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{formData.id ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
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
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                label="Role"
                required
              >
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
