'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/auth/types';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());
    params.append('sortField', sortField);
    params.append('sortDirection', sortDirection);

    if (filters.role) {
      params.append('role', filters.role);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }

    return params.toString();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      console.log('Current state:', { page, pageSize, sortField, sortDirection, filters });

      const queryParams = buildQueryParams();
      console.log('Query params:', queryParams);
      
      const response = await fetch(`/api/users?${queryParams}`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch users: ${errorData.error} - ${errorData.details}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      setUsers((prev) => {
        const newUsers = page === 1 ? data.users : [...prev, ...data.users];
        console.log('Previous users state:', prev);
        console.log('New users state:', newUsers);
        return newUsers;
      });
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
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

  useEffect(() => {
    console.log('Initial fetch triggered');
    void fetchUsers();
  }, [page, sortField, sortDirection, filters.role, filters.status, filters.search]);

  return {
    users,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    updateUser,
    deleteUser,
    updateUserStatus,
    bulkUpdateStatus,
    bulkDelete,
    refresh,
  };
} 