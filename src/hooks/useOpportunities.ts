import { useState, useEffect } from 'react';

import { Opportunity } from '@/types/opportunity';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      console.log('Starting to fetch opportunities...');
      try {
        const url = 'http://localhost:8000/api/opportunities/bankrewards';
        console.log('Making fetch request to:', url);
        const response = await fetch(url);
        console.log('Fetch response status:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch opportunities: ${response.status} ${response.statusText}`
          );
        }

        const text = await response.text();
        console.log('Raw response text:', text);

        let data;
        try {
          data = JSON.parse(text);
          console.log('Parsed response data:', data);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid JSON response from server');
        }

        // Check if data is in the expected format
        if (!data || typeof data !== 'object') {
          console.error('Invalid response format - not an object:', data);
          throw new Error('Invalid response format from server');
        }

        // Check if data has an opportunities array
        const opportunities = Array.isArray(data.opportunities)
          ? data.opportunities
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

        console.log('Extracted opportunities array:', opportunities);

        // Sort opportunities by value (converting string values if needed)
        const sortedOpportunities = [...opportunities].sort(
          (a: Opportunity, b: Opportunity) => {
            const valueA =
              typeof a.value === 'number' ? a.value : parseFloat(String(a.value));
            const valueB =
              typeof b.value === 'number' ? b.value : parseFloat(String(b.value));
            return valueB - valueA;
          }
        );

        console.log('Sorted opportunities:', sortedOpportunities);
        setOpportunities(sortedOpportunities);
        setIsCollecting(false);
      } catch (err) {
        console.error('Error in useOpportunities:', err);
        setError(err instanceof Error ? err : new Error('An error occurred'));
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return { opportunities, loading, error, isCollecting };
}
