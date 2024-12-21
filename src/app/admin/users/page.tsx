'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Checkbox,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useUsers, User } from './hooks/useUsers';
import UserTableToolbar from './components/UserTableToolbar';
import UserDetailsModal from './components/UserDetailsModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import { formatDistanceToNow } from 'date-fns';
import { UserRole } from '@/lib/auth/types';

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof User;
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'displayName', label: 'Name', numeric: false, sortable: true },
  { id: 'email', label: 'Email', numeric: false, sortable: true },
  { id: 'role', label: 'Role', numeric: false, sortable: true },
  { id: 'status', label: 'Status', numeric: false, sortable: true },
  { id: 'createdAt', label: 'Created', numeric: false, sortable: true },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof User) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;

  const createSortHandler = (property: keyof User) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all users',
            }}
          />
        </TableCell>
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
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
  );
}

export default function UsersPage() {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    role: '' as UserRole | '',
    status: '' as 'active' | 'inactive' | '',
    search: '',
  });
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

  const { users, loading, error, totalCount, updateUser, deleteUser, updateUserStatus, bulkDelete, bulkUpdateStatus } = useUsers({
    pageSize: rowsPerPage,
    sortField: orderBy,
    sortDirection: order,
    filters: {
      role: filters.role || undefined,
      status: filters.status || undefined,
      search: filters.search,
    },
  });

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
  };

  const handleSaveUser = async (user: User) => {
    try {
      await updateUser(user.id, user);
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
      setEditingUser(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update user',
        severity: 'error',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser(deletingUser.id);
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
      setDeletingUser(null);
      setSelected([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error',
      });
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    try {
      if (action === 'delete') {
        await bulkDelete(selected);
        setSnackbar({
          open: true,
          message: 'Users deleted successfully',
          severity: 'success',
        });
      } else if (action === 'activate') {
        await bulkUpdateStatus(selected, 'active');
        setSnackbar({
          open: true,
          message: 'Users activated successfully',
          severity: 'success',
        });
      } else if (action === 'deactivate') {
        await bulkUpdateStatus(selected, 'inactive');
        setSnackbar({
          open: true,
          message: 'Users deactivated successfully',
          severity: 'success',
        });
      }
      setSelected([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to perform bulk action',
        severity: 'error',
      });
    }
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading users: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <UserTableToolbar
          numSelected={selected.length}
          onBulkAction={handleBulkAction}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={users.length}
            />
            <TableBody>
              {users.map((user, index) => {
                const isItemSelected = isSelected(user.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, user.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={user.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={user.photoURL} alt={user.displayName}>
                          {user.displayName.charAt(0)}
                        </Avatar>
                        <Typography variant="body1">{user.displayName}</Typography>
                        {user.businessVerified && (
                          <Chip label="Business" size="small" color="primary" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === UserRole.ADMIN ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(user)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteUser(user)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {editingUser && (
        <UserDetailsModal
          open={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      <ConfirmationDialog
        open={!!deletingUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.displayName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
        severity="error"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 