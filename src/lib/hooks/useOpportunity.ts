import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FirestoreOpportunity } from '@/types/opportunity';

import { opportunityKeys } from '../query/keys';

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/opportunities/${id}`);
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error);
        }
        return res.json() as Promise<FirestoreOpportunity>;
      } catch (error) {
        toast.error('Failed to fetch opportunity: ' + (error as Error).message);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('not found')) return false;
      return failureCount < 3;
    },
  });
};
