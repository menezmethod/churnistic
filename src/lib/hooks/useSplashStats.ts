'use client';

import { useQuery } from '@tanstack/react-query';

import { formatCurrency } from '@/lib/utils/formatters';

interface OpportunityStats {
  // Basic stats for splash page
  activeCount: number;
  totalPotentialValue: number;
  averageValue: number;

  // Detailed stats for admin
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  highValue: number;
  byType: {
    bank: number;
    credit_card: number;
    brokerage: number;
  };

  // Metadata
  lastUpdated: string;
}

const fetchStats = async (): Promise<OpportunityStats> => {
  const response = await fetch('/api/opportunities/public-stats', {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const useSplashStats = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['opportunities', 'public-stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    select: (stats) => {
      // Format values for display
      const potentialValue = formatCurrency(stats.totalPotentialValue || 0);
      const averageValue = formatCurrency(stats.averageValue || 0);

      return [
        {
          label: 'POTENTIAL BONUS EARNINGS',
          value: potentialValue || '$0',
          description: 'Total value of all active bonus opportunities',
        },
        {
          label: 'BONUSES AVAILABLE',
          value: `${stats.activeCount || 0}+`,
          description: 'Number of active bonus opportunities',
        },
        {
          label: 'AVERAGE BONUS VALUE',
          value: averageValue || '$0',
          description: 'Average value per bonus opportunity',
        },
      ];
    },
    retry: 2,
    refetchOnWindowFocus: true,
  });

  return {
    stats: data || [],
    error,
    isLoading,
  };
};
