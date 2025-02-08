'use client';

import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { UserRole } from '@/lib/auth/types';
import { getFirebaseServices } from '@/lib/firebase/config';

import UserDetailsModal from './components/UserDetailsModal';
import type { User } from './hooks/useUsers';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof User;
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
    id: 'displayName',
    numeric: false,
    label: 'Display Name',
    sortable: true,
  },
  {
    id: 'role',
    numeric: false,
    label: 'Role',
    sortable: true,
  },
  {
    id: 'permissions',
    numeric: false,
    label: 'Permissions',
    sortable: false,
  },
  {
    id: 'createdAt',
    numeric: false,
    label: 'Created At',
    sortable: true,
  },
  {
    id: 'updatedAt',
    numeric: false,
    label: 'Last Updated',
    sortable: true,
  },
];

function descendingComparator<T extends User>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof User>(
  order: Order,
  orderBy: Key
): (a: User, b: User) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function UsersPage() {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    email: '',
    displayName: '',
    role: '',
  });

  // State for user actions
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { firestore } = await getFirebaseServices();
        const usersCollection = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching users',
          severity: 'error',
        });
      }
    };

    void fetchUsers();
  }, []);

  const handleRequestSort = (property: keyof User) => {
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

  const handleEditUser = (user: User | null) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      const { firestore } = await getFirebaseServices();
      await deleteDoc(doc(firestore, 'users', deletingUser.id));
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

  const handleUpdateUser = async (
    _user: User,
    data: { email?: string; displayName?: string; photoURL?: string; role?: string }
  ) => {
    try {
      const { firestore } = await getFirebaseServices();
      const userRef = doc(firestore, 'users', _user.id);
      await updateDoc(userRef, data);
      setUsers(
        users.map((user) =>
          user.id === _user.id
            ? {
                ...user,
                ...data,
                role: data.role as
                  | 'user'
                  | 'admin'
                  | 'manager'
                  | 'analyst'
                  | 'agent'
                  | 'free_user',
              }
            : user
        )
      );
      setEditingUser(null);
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user',
        severity: 'error',
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.email.toLowerCase().includes(filters.email.toLowerCase()) &&
      (user.displayName?.toLowerCase() ?? '').includes(
        filters.displayName.toLowerCase()
      ) &&
      (filters.role === '' || user.role === filters.role)
    );
  }) as User[];

  const sortedUsers = [...filteredUsers].sort(getComparator(order, orderBy));
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mb: 2 }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" component="div">
              User Management
            </Typography>
            <Button variant="contained" onClick={() => handleEditUser(null)}>
              Add User
            </Button>
          </Toolbar>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Filter by Email"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                size="small"
              />
              <TextField
                label="Filter by Name"
                value={filters.displayName}
                onChange={(e) => setFilters({ ...filters, displayName: e.target.value })}
                size="small"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={UserRole.USER}>User</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
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
                {paginatedUsers.map((user: User) => (
                  <TableRow hover key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === UserRole.ADMIN ? 'primary' : 'default'}
                        size="small"
                      />
                      {user.isSuperAdmin && (
                        <Chip
                          label="Super Admin"
                          color="secondary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {user.permissions?.map((permission) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(user.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user)}
                        color="error"
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
        </Paper>
      </Box>

      <UserDetailsModal
        open={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
      />

      <Dialog open={!!deletingUser} onClose={() => setDeletingUser(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
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
}
