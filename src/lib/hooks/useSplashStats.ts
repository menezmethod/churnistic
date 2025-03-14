'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

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
    environment?: string;
    appsCount?: number;
  };
}

// Create a function for manual retry that doesn't use the built-in retry mechanism
let manualRetryCount = 0;
const MAX_MANUAL_RETRIES = 10; // Allow more retries for initialization issues
const fetchWithRetry = async (): Promise<OpportunityStats> => {
  const originalFetchStart = Date.now();
  console.log('[CLIENT] Fetching public stats at', new Date().toISOString());
  console.log('[CLIENT] Manual retry count:', manualRetryCount);

  try {
    const fetchStart = Date.now();
    const response = await fetch('/api/opportunities/public-stats', {
      next: { revalidate: 0 }, // No revalidation
      cache: 'no-store', // Force a fresh request
      headers: {
        'X-Retry-Count': manualRetryCount.toString(), // Pass retry count to server
        Pragma: 'no-cache',
      },
    });

    const fetchDuration = Date.now() - fetchStart;
    console.log(
      `[CLIENT] Fetch completed in ${fetchDuration}ms, status: ${response.status}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CLIENT] Fetch error: ${response.status}`, errorText);
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    const data = await response.json();
    console.log('[CLIENT] Received stats data:', JSON.stringify(data));

    // If Firebase wasn't initialized, retry with exponential backoff
    if (data.debug?.firebaseInitialized === false) {
      manualRetryCount++;

      if (manualRetryCount <= MAX_MANUAL_RETRIES) {
        console.log(
          `[CLIENT] Firebase not initialized on server, manual retry ${manualRetryCount}/${MAX_MANUAL_RETRIES}`
        );

        // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, etc. up to 15s max)
        const delay = Math.min(1000 * Math.pow(2, manualRetryCount - 1), 15000);
        console.log(`[CLIENT] Waiting ${delay}ms before retry`);

        // Wait for the calculated delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Recursive retry
        return fetchWithRetry();
      } else {
        console.log(
          `[CLIENT] Max manual retries (${MAX_MANUAL_RETRIES}) reached, returning default data`
        );
        manualRetryCount = 0; // Reset for next time
      }
    } else {
      // Reset retry count if successful
      manualRetryCount = 0;
    }

    const totalDuration = Date.now() - originalFetchStart;
    console.log(`[CLIENT] Total fetch process took ${totalDuration}ms`);
    return data;
  } catch (error) {
    console.error('[CLIENT] Error in fetchWithRetry:', error);
    throw error;
  }
};

export const useSplashStats = () => {
  // Function to format stats data
  const formatStatsData = (stats: OpportunityStats) => {
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
  };

  // Regular react-query fetch
  const { data, error, isLoading } = useQuery({
    queryKey: ['opportunities', 'public-stats'],
    queryFn: fetchWithRetry,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    select: formatStatsData,
    retry: 3,
    refetchOnWindowFocus: true,
  });

  // Log errors from the main query
  useEffect(() => {
    if (error) {
      console.error('[CLIENT] Error in useSplashStats hook:', error);
    }
  }, [error]);

  return {
    stats: data || [],
    error,
    isLoading,
  };
};
