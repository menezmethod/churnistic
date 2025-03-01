// TODO: Migrate to Supabase Admin Functionality
// This file needs to be updated to use Supabase admin functionality instead of Firebase Admin
// Key changes needed:
// 1. Replace Firebase Admin SDK with Supabase service role client
// 2. Update user management operations to use Supabase Auth admin API
// 3. Update database operations to use Supabase database
// 4. Update real-time subscriptions to use Supabase real-time features

'use client';

import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Button, Container, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

import { UserRole } from '@/lib/auth/types';
import type { User } from '@/types/user';

import EditUserModal from './components/EditUserModal';
import { useUsers, useUpdateUser, useDeleteUser } from './hooks/useUsers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 250 },
  { field: 'email', headerName: 'Email', width: 250 },
  {
    field: 'role',
    headerName: 'Role',
    width: 150,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value}
        color={
          params.value === UserRole.SUPER_ADMIN
            ? 'error'
            : params.value === UserRole.ADMIN
              ? 'warning'
              : 'default'
        }
        size="small"
      />
    ),
  },
  {
    field: 'lastSignInAt',
    headerName: 'Last Sign In',
    width: 200,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : 'Never',
  },
  {
    field: 'createdAt',
    headerName: 'Created At',
    width: 200,
    valueFormatter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : 'N/A',
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <>
        <Tooltip title="Edit User">
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete User">
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </>
    ),
  },
];

export default function AdminUsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsEditModalOpen(false);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser.mutateAsync(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </div>
      <EditUserModal
        user={selectedUser}
        open={isEditModalOpen}
        onClose={handleCloseModal}
      />
    </Container>
  );
}
