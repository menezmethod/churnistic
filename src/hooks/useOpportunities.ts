import { useState, useEffect } from 'react';

interface Opportunity {
  id: string;
  title: string;
  value: string;
  type: string;
  bank?: string;
  description?: string;
  requirements?: string[];
  source?: string;
  sourceLink?: string;
  postedDate?: string;
  confidence?: number;
  status?: string;
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const response = await fetch('http://localhost:8000/opportunities/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        const data = await response.json();
        setOpportunities(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return { opportunities, isLoading, error };
}
