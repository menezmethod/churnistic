import { useQuery } from '@tanstack/react-query';

import { getOpportunities } from '@/lib/api/opportunities';
import { FirestoreOpportunity } from '@/types/opportunity';

export function useOpportunities() {
  return useQuery<FirestoreOpportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => getOpportunities(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
