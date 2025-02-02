import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';

type ScraperStatus =
  | 'idle'
  | 'running'
  | 'stopping'
  | 'initializing'
  | 'syncing'
  | 'error';

export const useBankRewardsScraper = () => {
  const [status, setStatus] = useState<ScraperStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalOffers: 0,
    newToday: 0,
    successRate: 0,
    avgTime: 0,
  });

  // Keep track of the polling interval
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear interval
  const cleanup = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  // Query to track scraper status
  const { refetch: refetchStats } = useQuery({
    queryKey: ['bankRewards', 'stats'],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
      if (!baseUrl) {
        throw new Error('BankRewards scraper URL is not configured');
      }

      console.log(
        '🔍 Scraper - Fetching stats from:',
        `${baseUrl}/api/bankrewards/collect`
      );
      const response = await fetch(`${baseUrl}/api/bankrewards/collect`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to get scraper stats');
      const data = await response.json();
      console.log('📊 Scraper - Stats response:', data);
      return data.stats;
    },
    enabled: false,
    retry: false,
  });

  const startScraper = async () => {
    try {
      cleanup();
      setStatus('initializing');
      setError(null);
      setProgress(0);

      const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
      if (!baseUrl) {
        throw new Error('BankRewards scraper URL is not configured');
      }

      console.log(
        '🚀 Scraper - Starting scraper at:',
        `${baseUrl}/api/bankrewards/collect`
      );
      const response = await fetch(`${baseUrl}/api/bankrewards/collect`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start scraper');
      }

      const result = await response.json();
      console.log('📦 Scraper - Start response:', result);
      if (!result.success) {
        throw new Error(result.error || 'Failed to start scraper');
      }

      // Update stats from POST response
      setStats({
        totalOffers: result.data.stats.total,
        newToday: 0, // Will be updated in polling
        successRate: 0,
        avgTime: 0,
      });

      setStatus('running');

      pollInterval.current = setInterval(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
          if (!baseUrl) {
            throw new Error('BankRewards scraper URL is not configured');
          }

          console.log(
            '🔄 Scraper - Polling status from:',
            `${baseUrl}/api/bankrewards/collect`
          );
          const statusResponse = await fetch(`${baseUrl}/api/bankrewards/collect`, {
            method: 'GET',
          });
          if (!statusResponse.ok) {
            throw new Error('Failed to get scraper status');
          }

          const statusResult = await statusResponse.json();
          console.log('📊 Scraper - Poll response:', statusResult);

          if (statusResult.status === 'completed') {
            cleanup();
            setStatus('idle');
            setProgress(100);
            await refetchStats();
          } else if (statusResult.status === 'error') {
            cleanup();
            setStatus('error');
            setError(new Error(statusResult.error || 'Scraper failed'));
          } else {
            setProgress(statusResult.progress || 0);
            // Update stats from GET response
            setStats((prev) => ({
              ...prev,
              totalOffers: statusResult.stats.totalOffers,
              newToday: statusResult.stats.newToday,
            }));
          }
        } catch (err) {
          cleanup();
          setError(err as Error);
          setStatus('error');
        }
      }, 2000);
    } catch (err) {
      cleanup();
      setError(err as Error);
      setStatus('error');
    }
  };

  const stopScraper = async () => {
    try {
      setStatus('stopping');

      const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
      if (!baseUrl) {
        throw new Error('BankRewards scraper URL is not configured');
      }

      // Call the stop endpoint
      const response = await fetch(`${baseUrl}/api/bankrewards/collect`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to stop scraper');
      }

      cleanup();
      setStatus('idle');
      setProgress(0);
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  };

  const syncWithFirestore = async () => {
    try {
      setStatus('syncing');
      const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
      if (!baseUrl) {
        throw new Error('BankRewards scraper URL is not configured');
      }

      const response = await fetch(`${baseUrl}/api/bankrewards/sync`, { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');

      // Update stats after sync
      const stats = await response.json();
      setStats(stats);

      // Refetch stats to update UI
      await refetchStats();

      setStatus('idle');
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    status,
    stats,
    isRunning: status === 'running',
    progress,
    error,
    startScraper,
    stopScraper,
    syncWithFirestore,
  };
};
