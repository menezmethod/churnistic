'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { UserRole } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';
import { mapUserToDatabaseFields } from '@/types/user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
  emailVerified: boolean;
  businessVerified: boolean;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Get the current session using the @supabase/ssr client
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw new Error('Authentication error');
        }

        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/functions/users', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch users: ${response.status}`
          );
        }

        const data = await response.json();
        return data.users as User[];
      } catch (error) {
        console.error('Error in useUsers hook:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      // Convert from frontend format to database format
      const dbFields = mapUserToDatabaseFields(data);

      // Add updated_at field
      dbFields.updated_at = new Date().toISOString();

      const { error } = await supabase.from('users').update(dbFields).eq('id', userId);

      if (error) throw error;

      return { userId, data };
    },
    onMutate: async ({ userId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(['users']);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          ['users'],
          previousUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role: data.role || user.role,
                  displayName: data.displayName || user.displayName,
                  avatarUrl: data.avatarUrl || user.avatarUrl,
                  updatedAt: new Date().toISOString(),
                }
              : user
          )
        );
      }

      return { previousUsers };
    },
    onError: (err, { userId }, context) => {
      console.error(`Error updating user ${userId}:`, err);
      // Revert back to the previous state if available
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      return userId;
    },
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(['users']);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          ['users'],
          previousUsers.filter((user) => user.id !== userId)
        );
      }

      return { previousUsers };
    },
    onError: (err, userId, context) => {
      console.error(`Error deleting user ${userId}:`, err);
      // Revert back to the previous state if available
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
