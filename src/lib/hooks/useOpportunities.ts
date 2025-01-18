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

const updateOpportunity = async (
  id: string,
  data: Partial<FirestoreOpportunity>
): Promise<FirestoreOpportunity> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
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

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: (_, deletedId) => {
      // Optimistically update the cache
      queryClient.setQueryData<FirestoreOpportunity[]>(['opportunities'], (old) => {
        return old ? old.filter((opp) => opp.id !== deletedId) : [];
      });
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreOpportunity> }) =>
      updateOpportunity(id, data),
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
    },
  });

  return {
    ...query,
    createOpportunity: createMutation.mutateAsync,
    deleteOpportunity: deleteMutation.mutateAsync,
    updateOpportunity: updateMutation.mutateAsync,
    isCreating: createMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isUpdating: updateMutation.isLoading,
  };
}
