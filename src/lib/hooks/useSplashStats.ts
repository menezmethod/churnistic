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
  debug?: {
    firebaseInitialized: boolean;
    requestDuration: number;
    dbQueryDuration?: number;
    timestamp: number;
    initAttempts?: number;
  };
}

const fetchStats = async (): Promise<OpportunityStats> => {
  console.log('[CLIENT] Fetching public stats at', new Date().toISOString());
  const fetchStart = Date.now();
  
  const response = await fetch('/api/opportunities/public-stats', {
    next: { revalidate: 300 }, // Cache for 5 minutes
    cache: 'no-store', // Force a fresh request
  });
  
  const fetchDuration = Date.now() - fetchStart;
  console.log(`[CLIENT] Fetch completed in ${fetchDuration}ms, status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[CLIENT] Fetch error: ${response.status}`, errorText);
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('[CLIENT] Received stats data:', JSON.stringify(data));
  
  // Check if Firebase was not initialized and retry with a delay
  if (data.debug?.firebaseInitialized === false) {
    console.log('[CLIENT] Firebase not initialized on server, will retry after delay');
    
    // Throw special error to trigger retry
    throw new Error('Firebase-not-initialized');
  }
  
  return data;
};

export const useSplashStats = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['opportunities', 'public-stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    select: (stats) => {
      console.log('[CLIENT] Processing stats data in select:', JSON.stringify(stats));
      
      // Ensure we have valid numbers before formatting
      const potentialValue =
        typeof stats.totalPotentialValue === 'string'
          ? stats.totalPotentialValue // Already formatted
          : formatCurrency(stats.totalPotentialValue || 0);

      const averageValue =
        typeof stats.averageValue === 'string'
          ? stats.averageValue // Already formatted
          : formatCurrency(stats.averageValue || 0);

      const formattedStats = [
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
      
      console.log('[CLIENT] Formatted stats:', JSON.stringify(formattedStats));
      return formattedStats;
    },
    retry: (failureCount, error) => {
      // Special retry logic for Firebase initialization issues
      if (error instanceof Error && error.message === 'Firebase-not-initialized') {
        console.log(`[CLIENT] Retrying due to Firebase initialization issue (attempt ${failureCount + 1})`);
        return true; // Always retry for this specific error
      }
      
      // Standard retry logic for other errors (up to 2 times)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with longer delays for Firebase initialization issues
      const baseDelay = 1000; // 1 second
      const delay = Math.min(baseDelay * Math.pow(2, attemptIndex), 10000); // Max 10 seconds
      console.log(`[CLIENT] Retry delay: ${delay}ms`);
      return delay;
    },
    refetchOnWindowFocus: true,
  });

  if (error) {
    console.error('[CLIENT] Error in useSplashStats hook:', error);
  }

  return {
    stats: data || [],
    error,
    isLoading,
  };
};
