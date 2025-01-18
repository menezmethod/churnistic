import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createOpportunity,
  deleteOpportunity,
  getOpportunities,
  updateOpportunity,
} from '@/lib/api/opportunities';
import { FirestoreOpportunity } from '@/types/opportunity';

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
