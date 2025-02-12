import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MutationFunction, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FirestoreOpportunity } from '@/types/opportunity';

import { opportunityKeys } from '../query/keys';

type MutationContext = {
  prev: FirestoreOpportunity | undefined;
};

export const useUpdateOpportunity = (
  options?: UseMutationOptions<
    FirestoreOpportunity,
    Error,
    { id: string; data: Partial<FirestoreOpportunity> },
    MutationContext
  >
) => {
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<
    FirestoreOpportunity,
    { id: string; data: Partial<FirestoreOpportunity> }
  > = async ({ id, data }) => {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to update opportunity');
    }
    return res.json();
  };

  return useMutation({
    mutationFn,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: opportunityKeys.detail(id) });

      // Snapshot the previous value
      const prev = queryClient.getQueryData<FirestoreOpportunity>(
        opportunityKeys.detail(id)
      );

      // Optimistically update the cache
      if (prev) {
        queryClient.setQueryData<FirestoreOpportunity>(opportunityKeys.detail(id), {
          ...prev,
          ...data,
          metadata: {
            ...prev.metadata,
            ...data.metadata,
            updated_at: new Date().toISOString(),
          },
        });
      }

      // Return context with the prev value
      return { prev };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(opportunityKeys.detail(id), context.prev);
      }
      toast.error('Failed to update opportunity: ' + err.message);
    },
    onSuccess: (data, { id }) => {
      // Update all related queries
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
      toast.success('Opportunity updated successfully');
    },
    retry: 2,
    ...options,
  });
};

export * from './useUpdateOpportunity'; // If using barrel file
// OR directly export the hook if not
