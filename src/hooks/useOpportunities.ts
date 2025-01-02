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
        const url = 'http://localhost:3000/api/bankrewards?format=detailed';
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
        if (!data || typeof data !== 'object' || !Array.isArray(data.offers)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from server');
        }

        // Transform the offers into the expected Opportunity format
        const transformedOpportunities = data.offers.map((offer: any) => ({
          _id: offer.id,
          id: offer.id,
          title: offer.name,
          type: offer.type,
          value: offer.value,
          bank: offer.name.split(' ')[0],
          description: offer.bonus?.description || '',
          requirements: [offer.bonus?.requirements?.description || ''],
          url: offer.offer_link,
          source: {
            name: 'BankRewards',
            url: offer.offer_link,
          },
          metadata: {
            created_at: offer.metadata.created,
            last_updated: offer.metadata.updated,
            version: '1.0',
            credit: offer.details?.credit_inquiry
              ? {
                  inquiry: offer.details.credit_inquiry,
                  chase_524_rule: offer.details?.under_5_24 || false,
                }
              : undefined,
            fees: {
              annual: offer.details?.annual_fees || 'None',
              monthly: offer.details?.monthly_fees?.amount || 'None',
              foreign_transaction: offer.details?.foreign_transaction_fees,
            },
            availability:
              offer.details?.availability?.type === 'Nationwide'
                ? { regions: [], is_nationwide: true, restrictions: null }
                : {
                    regions: offer.details?.availability?.states || [],
                    is_nationwide: false,
                    restrictions: null,
                  },
          },
          created_at: offer.metadata.created,
          last_updated: offer.metadata.updated,
          bonus: {
            amount: parseFloat(
              offer.bonus?.description
                ?.match(/\$?(\d+(?:,\d+)?)/)?.[1]
                ?.replace(',', '') || '0'
            ),
            currency: 'USD',
            requirements: [offer.bonus?.requirements?.description || ''],
          },
          timing: {
            posted_date: offer.metadata.created,
            last_verified: offer.metadata.updated,
            expiration: offer.details?.expiration || 'None Listed',
          },
          offer_link: offer.offer_link,
          status: 'active',
          logo: offer.logo,
          card_image: offer.card_image,
        }));

        console.log('Transformed opportunities:', transformedOpportunities);
        setOpportunities(transformedOpportunities);
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
