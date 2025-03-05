import { useQuery } from '@tanstack/react-query';

export const useOffersValidationCount = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['offers', 'validation-count'],
    queryFn: async () => {
      const response = await fetch('/api/opportunities/stats');
      if (!response.ok) throw new Error('Failed to fetch validation count');
      const data = await response.json();
      return data.pending || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true,
  });

  return {
    validationCount: data || 0,
    isLoading,
    error,
  };
};
