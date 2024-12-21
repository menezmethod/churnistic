import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const RolesPage = (): JSX.Element => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleSaveRole = async () => {
    try {
      // Save role logic here
      setSnackbar({
        open: true,
        message: 'Role saved successfully',
        severity: 'success',
      });
      setDialogOpen(false);
      setEditRole(null);
    } catch (err) {
      console.error('Error saving role:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save role',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          Roles
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditRole(null);
            setDialogOpen(true);
          }}
        >
          Add Role
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{/* Role rows will be mapped here */}</TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Role Name"
              value={editRole?.name || ''}
              onChange={(e) =>
                setEditRole((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={editRole?.description || ''}
              onChange={(e) =>
                setEditRole((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default RolesPage;
