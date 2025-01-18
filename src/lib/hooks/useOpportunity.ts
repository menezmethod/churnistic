import { useQuery } from '@tanstack/react-query';

import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

const getOpportunityById = async (id: string): Promise<FirestoreOpportunity> => {
  const response = await fetch(`${API_BASE}/${id}`);
  return handleResponse<FirestoreOpportunity>(response);
};

export function useOpportunity(id: string) {
  return useQuery<FirestoreOpportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunityById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
