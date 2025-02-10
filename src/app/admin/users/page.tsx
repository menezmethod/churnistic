'use client';

import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Typography,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

import { UserRole } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';

interface UserWithRole extends User {
  roles: { role: UserRole }[];
}

interface DbUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface DbUserRole {
  role: UserRole;
  user: DbUser;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof (User & { roles: { role: string }[] });
  label: string;
  numeric: boolean;
  sortable?: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'email',
    numeric: false,
    label: 'Email',
    sortable: true,
  },
  {
    id: 'roles',
    numeric: false,
    label: 'Roles',
    sortable: true,
  },
  {
    id: 'created_at',
    numeric: false,
    label: 'Created At',
    sortable: true,
  },
  {
    id: 'last_sign_in_at',
    numeric: false,
    label: 'Last Sign In',
    sortable: true,
  },
];

type SortableUserFields = {
  [K in keyof (User & { roles: { role: string }[] })]: unknown;
};

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<K extends keyof SortableUserFields>(
  order: Order,
  orderBy: K
): (a: UserWithRole, b: UserWithRole) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function UsersPage() {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] =
    useState<keyof (User & { roles: { role: string }[] })>('created_at');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    email: '',
    role: '',
  });

  // State for user actions
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, user:user_id(id, email, created_at, last_sign_in_at)')
          .returns<DbUserRole[]>();

        if (error) throw error;

        const formattedUsers = (data || []).map(({ role, user }) => ({
          ...user,
          roles: [{ role }],
        })) as UserWithRole[];

        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching users',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const handleRequestSort = (property: keyof (User & { roles: { role: string }[] })) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(deletingUser.id);
      if (error) throw error;

      setUsers(users.filter((user) => user.id !== deletingUser.id));
      setDeletingUser(null);
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting user',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

      if (error) throw error;

      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                roles: [{ role }],
              }
            : user
        )
      );

      setSnackbar({
        open: true,
        message: 'User role updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user role',
        severity: 'error',
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const emailMatch =
      user.email?.toLowerCase().includes(filters.email.toLowerCase()) ?? false;
    const roleMatch = !filters.role || user.roles.some((r) => r.role === filters.role);
    return emailMatch && roleMatch;
  });

  const sortedUsers = filteredUsers.sort(getComparator(order, orderBy));
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
          }}
        >
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Users
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Search Email"
              variant="outlined"
              size="small"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              disabled={loading}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Toolbar>
        {loading ? (
          <Box sx={{ width: '100%', p: 2 }}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        {headCell.sortable ? (
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={() => handleRequestSort(headCell.id)}
                          >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                              <Box component="span" sx={visuallyHidden}>
                                {order === 'desc'
                                  ? 'sorted descending'
                                  : 'sorted ascending'}
                              </Box>
                            ) : null}
                          </TableSortLabel>
                        ) : (
                          headCell.label
                        )}
                      </TableCell>
                    ))}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow hover key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {user.roles.map((role) => (
                            <Chip
                              key={role.role}
                              label={role.role}
                              color={
                                role.role === UserRole.SUPER_ADMIN
                                  ? 'warning'
                                  : role.role === UserRole.ADMIN
                                    ? 'error'
                                    : 'default'
                              }
                              size="small"
                            />
                          ))}
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value=""
                              displayEmpty
                              onChange={(e) =>
                                handleUpdateUserRole(user.id, e.target.value as UserRole)
                              }
                            >
                              <MenuItem value="" disabled>
                                Add Role
                              </MenuItem>
                              {Object.values(UserRole)
                                .filter(
                                  (role) => !user.roles.some((r) => r.role === role)
                                )
                                .map((role) => (
                                  <MenuItem key={role} value={role}>
                                    {role}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleDeleteUser(user)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the user {deletingUser?.email}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
