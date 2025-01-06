import { useQuery } from '@tanstack/react-query';

import { getOpportunityById } from '@/lib/api/opportunities';
import { FirestoreOpportunity } from '@/types/opportunity';

export function useOpportunity(id: string) {
  return useQuery<FirestoreOpportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunityById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
