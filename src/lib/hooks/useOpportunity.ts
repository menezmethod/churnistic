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
  const data = await handleResponse<FirestoreOpportunity>(response);
  console.log('API Response:', {
    id: data.id,
    metadata: data.metadata,
    featured: data.metadata?.featured,
  });
  return data;
};

export function useOpportunity(id: string) {
  return useQuery<FirestoreOpportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunityById(id),
    enabled: !!id,
    gcTime: 1000 * 60 * 5, // Changed from staleTime
    staleTime: 1000 * 60 * 1, // Added explicit staleTime
    select: (data) => ({
      ...data,
      metadata: {
        ...data.metadata,
        featured: Boolean(data.metadata?.featured), // Ensure boolean
      },
    }),
  });
}
