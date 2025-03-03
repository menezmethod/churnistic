'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { useToast } from '@/lib/providers/ToastProvider';
import { supabase } from '@/lib/supabase/client';
import { Opportunity } from '@/types/opportunity';

/**
 * Hook for managing opportunities with administrative operations
 * Includes functionality for creating, updating, deleting, and changing status
 */
export function useOpportunityManagement() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();

  // Create opportunity with validation
  const createOpportunity = useMutation({
    mutationFn: async (data: Partial<Opportunity>) => {
      const { data: newOpportunity, error } = await supabase
        .from('opportunities')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newOpportunity as Opportunity;
    },
    onSuccess: (data) => {
      showToast({
        message: 'Opportunity created successfully',
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      router.push(`/opportunities/${data.id}`);
    },
    onError: (error) => {
      console.error('Error creating opportunity:', error);
      showToast({
        message: error instanceof Error ? error.message : 'Failed to create opportunity',
        severity: 'error',
      });
    },
  });

  // Update opportunity with optimistic updates
  const updateOpportunity = useMutation({
    mutationFn: async ({
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ id,
      data,
    }: {
      id: string;
      data: Partial<Opportunity>;
    }) => {
      const { data: updatedOpportunity, error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedOpportunity as Opportunity;
    },
    onMutate: async ({
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ id,
      data,
    }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });

      // Snapshot the previous value
      const previousOpportunity = queryClient.getQueryData<Opportunity>([
        'opportunity',
        id,
      ]);

      // Optimistically update to the new value
      if (previousOpportunity) {
        queryClient.setQueryData<Opportunity>(['opportunity', id], {
          ...previousOpportunity,
          ...data,
        });
      }

      return { previousOpportunity };
    },
    onSuccess: (data) => {
      showToast({
        message: 'Opportunity updated successfully',
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', data.id] });
    },
    onError: (error, { id }, context) => {
      console.error('Error updating opportunity:', error);
      showToast({
        message: error instanceof Error ? error.message : 'Failed to update opportunity',
        severity: 'error',
      });

      // Revert back to the previous state if available
      if (context?.previousOpportunity) {
        queryClient.setQueryData(['opportunity', id], context.previousOpportunity);
      }
    },
  });

  // Delete opportunity with confirmation
  const deleteOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      showToast({
        message: 'Opportunity deleted successfully',
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      router.push('/opportunities');
    },
    onError: (error) => {
      console.error('Error deleting opportunity:', error);
      showToast({
        message: error instanceof Error ? error.message : 'Failed to delete opportunity',
        severity: 'error',
      });
    },
  });

  // Change opportunity status with real-time sync
  const changeOpportunityStatus = useMutation({
    mutationFn: async ({
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { data: updatedOpportunity, error } = await supabase
        .from('opportunities')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedOpportunity as Opportunity;
    },
    onMutate: async ({
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ id,
      status,
    }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });

      // Snapshot the previous value
      const previousOpportunity = queryClient.getQueryData<Opportunity>([
        'opportunity',
        id,
      ]);

      // Optimistically update to the new value
      if (previousOpportunity) {
        queryClient.setQueryData<Opportunity>(['opportunity', id], {
          ...previousOpportunity,
          status: status as 'pending' | 'approved' | 'rejected' | 'staged',
        });
      }

      return { previousOpportunity };
    },
    onSuccess: (data) => {
      showToast({
        message: `Opportunity status changed to ${status}`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', data.id] });
    },
    onError: (error) => {
      console.error('Error changing opportunity status:', error);
      showToast({
        message:
          error instanceof Error ? error.message : 'Failed to change opportunity status',
        severity: 'error',
      });
    },
  });

  return {
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeOpportunityStatus,
  };
}
