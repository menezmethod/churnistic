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
  Box,
  Alert,
} from '@mui/material';
import { useState } from 'react';

import { UserRole } from '@/lib/auth/types';
import type { User } from '@/types/user';

import { useUpdateUser } from '../hooks/useUsers';

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export default function EditUserModal({ user, open, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  const [error, setError] = useState<string | null>(null);
  const updateUser = useUpdateUser();

  const handleChange = (field: keyof User, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (!user?.id) return;

      await updateUser.mutateAsync({
        userId: user.id,
        data: {
          displayName: formData.displayName,
          role: formData.role,
          status: formData.status,
        },
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Display Name"
            value={formData.displayName || ''}
            onChange={(e) => handleChange('displayName', e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role || ''}
              label="Role"
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <MenuItem value={UserRole.USER}>User</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || ''}
              label="Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateUser.isPending}
        >
          {updateUser.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
