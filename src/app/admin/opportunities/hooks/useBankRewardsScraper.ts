import { useState } from 'react';

type ScraperStatus = 'idle' | 'running' | 'stopping' | 'initializing' | 'syncing' | 'error';

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

  const startScraper = async () => {
    try {
      setStatus('initializing');
      setError(null);
      
      const response = await fetch('/api/bankrewards/collect', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start scraper');
      
      setStatus('running');
      // Simulate progress - replace with actual progress tracking
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('idle');
            return 100;
          }
          return prev + 10;
        });
      }, 1000);
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  };

  const stopScraper = async () => {
    setStatus('stopping');
    // Add actual stop implementation
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
    }, 1000);
  };

  const syncWithFirestore = async () => {
    try {
      setStatus('syncing');
      const response = await fetch('/api/bankrewards/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      // Update stats after sync
      const stats = await response.json();
      setStats(stats);
      setStatus('idle');
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  };

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