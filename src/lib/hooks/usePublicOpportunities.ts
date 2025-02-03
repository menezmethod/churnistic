import { useQuery } from '@tanstack/react-query';

export interface PublicOpportunity {
  id: string;
  name: string;
  type: string;
  value?: number;
  logo?: {
    url?: string;
    type?: 'icon' | 'url';
  };
  status?: string;
  metadata?: Record<string, unknown>;
}

async function fetchPublicOpportunities(): Promise<PublicOpportunity[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const response = await fetch(`${baseUrl}/api/opportunities/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch public opportunities');
  }
  const data = await response.json();
  return data.opportunities || [];
}

export function usePublicOpportunities() {
  const {
    data: opportunities = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['opportunities', 'public'],
    queryFn: fetchPublicOpportunities,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    opportunities,
    error,
    isLoading,
  };
}
