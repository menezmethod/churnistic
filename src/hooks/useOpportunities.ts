import { useState, useEffect } from 'react';

import { Opportunity } from '@/types/opportunity';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const response = await fetch('/api/opportunities/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        const data = await response.json();
        console.log('Fetched opportunities:', data); // Debug log

        if (!Array.isArray(data)) {
          console.error('Invalid response format:', data);
          setOpportunities([]);
          return;
        }

        setOpportunities(data);
        setIsCollecting(false); // Reset collecting state
      } catch (err) {
        console.error('Error in useOpportunities:', err);
        setError(err instanceof Error ? err : new Error('An error occurred'));
        setOpportunities([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return { opportunities, isLoading, error, isCollecting };
}
