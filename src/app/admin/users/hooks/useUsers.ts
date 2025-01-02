'use client';

import { useState, useEffect, useCallback } from 'react';

import { UserRole } from '@/lib/auth/types';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin' | 'manager' | 'analyst' | 'agent' | 'free_user';
  status: string;
  creditScore: number | null;
  monthlyIncome: number | null;
  createdAt: string;
  updatedAt: string;
  firebaseUid: string;
  customDisplayName: string | null;
  permissions?: string[];
  isSuperAdmin?: boolean;
}

interface UseUsersOptions {
  pageSize?: number;
  sortField?: keyof User;
  sortDirection?: 'asc' | 'desc';
  filters?: {
    role?: UserRole;
    status?: 'active' | 'inactive';
    search?: string;
  };
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<void>;
  bulkUpdateStatus: (userIds: string[], status: 'active' | 'inactive') => Promise<void>;
  bulkDelete: (userIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUsers({
  pageSize = 10,
  sortField = 'createdAt',
  sortDirection = 'desc',
  filters = {},
}: UseUsersOptions = {}): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortField,
        sortDirection,
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/users?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortDirection, filters]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const loadMore = async () => {
    if (loading) return;
    setPage((prev) => prev + 1);
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      await refresh();
    } catch (err) {
      console.error('Error updating user:', err);
      throw new Error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await refresh();
    } catch (err) {
      console.error('Error deleting user:', err);
      throw new Error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    await updateUser(userId, { status });
  };

  const bulkUpdateStatus = async (userIds: string[], status: 'active' | 'inactive') => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          update: { status },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update users');
      }

      await refresh();
    } catch (err) {
      console.error('Error bulk updating users:', err);
      throw new Error('Failed to bulk update users');
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (userIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk delete users');
      }

      await refresh();
    } catch (err) {
      console.error('Error bulk deleting users:', err);
      throw new Error('Failed to bulk delete users');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setPage(1);
    await fetchUsers();
  };

  return {
    users,
    loading,
    error,
    totalCount,
    hasMore: false,
    loadMore,
    updateUser,
    deleteUser,
    updateUserStatus,
    bulkUpdateStatus,
    bulkDelete,
    refresh,
  };
}
