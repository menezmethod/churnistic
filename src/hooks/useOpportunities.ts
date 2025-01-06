import { useState, useEffect } from 'react';

import { FormData, FirestoreOpportunity } from '@/types/opportunity';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCollecting] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        console.log('Fetching opportunities...');
        const response = await fetch('/api/opportunities');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response not OK:', response.status, errorText);
          throw new Error(
            `Failed to fetch opportunities: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log('Received data:', data);

        // Transform the data to match the UI's expected format
        if (data.opportunities && Array.isArray(data.opportunities)) {
          console.log('Data has opportunities array, length:', data.opportunities.length);
          const transformedOpportunities = data.opportunities.map(
            (opp: FirestoreOpportunity) => {
              // Convert the numeric value to string for the UI
              const formattedOpp: FormData = {
                ...opp,
                value: opp.value.toString(),
                details: {
                  ...opp.details,
                  availability: {
                    type: opp.details.availability?.type || 'Nationwide',
                    states: opp.details.availability?.states || [],
                  },
                },
              };
              return formattedOpp;
            }
          );
          console.log('Transformed opportunities:', transformedOpportunities);
          setOpportunities(transformedOpportunities);
        } else {
          console.error('Unexpected data format:', data);
          throw new Error('Unexpected data format received from API');
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return { opportunities, loading, error, isCollecting };
}
