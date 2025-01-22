import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

const getOpportunities = async (): Promise<FirestoreOpportunity[]> => {
  const response = await fetch(API_BASE);
  return handleResponse<FirestoreOpportunity[]>(response);
};

const createOpportunity = async (
  data: Omit<FirestoreOpportunity, 'id'>
): Promise<FirestoreOpportunity> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

const updateOpportunity = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<FirestoreOpportunity>;
}): Promise<FirestoreOpportunity> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

const deleteOpportunity = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete opportunity');
  }
};

export function useOpportunities() {
  const queryClient = useQueryClient();

  const query = useQuery<FirestoreOpportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => getOpportunities(),
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: (newOpportunity) => {
      // Optimistically update the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(['opportunities'], (old) => {
        return old ? [newOpportunity, ...old] : [newOpportunity];
      });
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOpportunity,
    onSuccess: (updatedOpportunity) => {
      // Optimistically update the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(['opportunities'], (old) => {
        return old
          ? old.map((opp) =>
              opp.id === updatedOpportunity.id ? updatedOpportunity : opp
            )
          : [];
      });
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({
        queryKey: ['opportunity', updatedOpportunity.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', deletedId] });

      // Snapshot the previous value
      const previousOpportunities = queryClient.getQueryData<FirestoreOpportunity[]>([
        'opportunities',
      ]);

      // Optimistically remove the opportunity from the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(['opportunities'], (old) => {
        return old ? old.filter((opp) => opp.id !== deletedId) : [];
      });

      // Remove the individual opportunity from cache
      queryClient.setQueryData(['opportunity', deletedId], null);

      // Return the snapshot for rollback
      return { previousOpportunities };
    },
    onError: (error, deletedId, context) => {
      // Roll back to the previous value on error
      if (context?.previousOpportunities) {
        queryClient.setQueryData(['opportunities'], context.previousOpportunities);
      }
      console.error('Error deleting opportunity:', error);
    },
    onSettled: (_, __, deletedId) => {
      // Only invalidate the opportunities list query
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      // Remove the individual opportunity query instead of invalidating it
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
    },
  });

  return {
    ...query,
    createOpportunity: createMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
