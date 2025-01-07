import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      // Invalidate and refetch opportunities after deletion
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreOpportunity> }) =>
      updateOpportunity(id, data),
    onSuccess: () => {
      // Invalidate and refetch opportunities after update
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  return {
    ...query,
    deleteOpportunity: deleteMutation.mutateAsync,
    updateOpportunity: updateMutation.mutateAsync,
  };
}
