import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Request failed');
    } catch (e) {
      // If parsing the error response fails, throw a generic error
      if (e instanceof SyntaxError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw e;
    }
  }
  try {
    return await response.json();
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON response from server');
    }
    throw e;
  }
}

const getOpportunities = async (params?: {
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
}): Promise<FirestoreOpportunity[]> => {
  const url = new URL(API_BASE, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString());
      }
    });
  }
  const response = await fetch(url);
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

const updateOpportunity = async (params: {
  id: string;
  data: Partial<FirestoreOpportunity>;
}): Promise<FirestoreOpportunity> => {
  const { id, data } = params;

  // Prepare payload with proper metadata handling
  const payload = data.metadata
    ? { ...data, metadata: { ...data.metadata, updated_at: new Date().toISOString() } }
    : { ...data, metadata: { updated_at: new Date().toISOString() } };

  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

// Type guard for FirestoreOpportunity
function isFirestoreOpportunity(response: unknown): response is FirestoreOpportunity {
  return (
    typeof response === 'object' &&
    response !== null &&
    'id' in response &&
    'metadata' in response
  );
}

const deleteOpportunity = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete opportunity');
  }
};

export function useOpportunities(params?: {
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
}) {
  const queryClient = useQueryClient();

  const query = useQuery<FirestoreOpportunity[]>({
    queryKey: ['opportunities', params],
    queryFn: () => getOpportunities(params),
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: (newOpportunity) => {
      // Optimistically update the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old ? [newOpportunity, ...old] : [newOpportunity];
        }
      );
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['opportunities', params] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOpportunity,
    onSuccess: (updatedOpportunity) => {
      if (!isFirestoreOpportunity(updatedOpportunity)) return;
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old
            ? old.map((opp) =>
                opp.id === updatedOpportunity.id ? updatedOpportunity : opp
              )
            : [];
        }
      );
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['opportunities', params] });
      queryClient.invalidateQueries({
        queryKey: ['opportunity', updatedOpportunity.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities', params] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', deletedId] });

      // Snapshot the previous value
      const previousOpportunities = queryClient.getQueryData<FirestoreOpportunity[]>([
        'opportunities',
        params,
      ]);

      // Optimistically remove the opportunity from the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old ? old.filter((opp) => opp.id !== deletedId) : [];
        }
      );

      // Remove the individual opportunity from cache
      queryClient.setQueryData(['opportunity', deletedId], null);

      // Return the snapshot for rollback
      return { previousOpportunities };
    },
    onError: (error, deletedId, context) => {
      // Roll back to the previous value on error
      if (context?.previousOpportunities) {
        queryClient.setQueryData(
          ['opportunities', params],
          context.previousOpportunities
        );
      }
      console.error('Error deleting opportunity:', error);
    },
    onSettled: (_, __, deletedId) => {
      // Only invalidate the opportunities list query
      queryClient.invalidateQueries({ queryKey: ['opportunities', params] });
      // Remove the individual opportunity query instead of invalidating it
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
    },
  });

  return {
    opportunities: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createOpportunity: createMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
