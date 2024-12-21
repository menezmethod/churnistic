'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'ADMIN',
    description: 'Full system access',
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'roles.manage',
      'settings.manage',
    ],
    userCount: 2,
  },
  {
    id: '2',
    name: 'MANAGER',
    description: 'Team management access',
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'settings.view',
    ],
    userCount: 5,
  },
  {
    id: '3',
    name: 'ANALYST',
    description: 'Data analysis access',
    permissions: [
      'users.view',
      'reports.view',
      'reports.create',
    ],
    userCount: 8,
  },
];

const availablePermissions = [
  { id: 'users.view', name: 'View Users' },
  { id: 'users.create', name: 'Create Users' },
  { id: 'users.edit', name: 'Edit Users' },
  { id: 'users.delete', name: 'Delete Users' },
  { id: 'roles.manage', name: 'Manage Roles' },
  { id: 'settings.manage', name: 'Manage Settings' },
  { id: 'settings.view', name: 'View Settings' },
  { id: 'reports.view', name: 'View Reports' },
  { id: 'reports.create', name: 'Create Reports' },
];

export default function RolesPage() {
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSaveRole = async () => {
    try {
      // TODO: Implement role save functionality
      setSnackbar({
        open: true,
        message: `Role ${editRole ? 'updated' : 'created'} successfully`,
        severity: 'success',
      });
      setDialogOpen(false);
      setEditRole(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save role',
        severity: 'error',
      });
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      // TODO: Implement role delete functionality
      setSnackbar({
        open: true,
        message: 'Role deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete role',
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4">Role Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditRole(null);
              setDialogOpen(true);
            }}
          >
            Add Role
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {mockRoles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card>
                <CardHeader
                  title={role.name}
                  subheader={`${role.userCount} users`}
                  action={
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditRole(role);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {role.name !== 'ADMIN' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRole(role)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  }
                />
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {role.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Permissions:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {role.permissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={
                            availablePermissions.find((p) => p.id === permission)
                              ?.name || permission
                          }
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditRole(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  defaultValue={editRole?.name}
                  disabled={editRole?.name === 'ADMIN'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  defaultValue={editRole?.description}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Permissions
                </Typography>
                <FormGroup>
                  {availablePermissions.map((permission) => (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Switch
                          defaultChecked={editRole?.permissions.includes(
                            permission.id
                          )}
                          disabled={editRole?.name === 'ADMIN'}
                        />
                      }
                      label={permission.name}
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditRole(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={editRole?.name === 'ADMIN'}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 