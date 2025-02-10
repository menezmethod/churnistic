import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Database } from '@/types/supabase';

type TrackingStatus = Database['public']['Enums']['tracking_status'];

interface UserOffer {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: TrackingStatus;
  notes?: string;
  reminder_date?: string;
  applied_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  opportunities?: Record<
    string,
    {
      id: string;
      title: string;
      status: string;
      value: number;
    }
  >;
}

export function useUserOffers() {
  const [loading, setLoading] = useState(false);
  const [userOffers, setUserOffers] = useState<UserOffer[]>([]);

  const fetchUserOffers = useCallback(async (status?: TrackingStatus) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await fetch(`/api/opportunities/track?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tracked opportunities');

      const data = await response.json();
      setUserOffers(data);
    } catch (error) {
      console.error('Error fetching user offers:', error);
      toast.error('Failed to fetch tracked opportunities');
    } finally {
      setLoading(false);
    }
  }, []);

  const trackOpportunity = useCallback(
    async ({
      opportunityId,
      status,
      notes,
      reminderDate,
    }: {
      opportunityId: string;
      status: TrackingStatus;
      notes?: string;
      reminderDate?: string;
    }) => {
      try {
        setLoading(true);
        const response = await fetch('/api/opportunities/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity_id: opportunityId,
            status,
            notes,
            reminder_date: reminderDate,
          }),
        });

        if (!response.ok) throw new Error('Failed to track opportunity');

        const data = await response.json();
        setUserOffers((prev) => {
          const index = prev.findIndex((o) => o.opportunity_id === opportunityId);
          if (index >= 0) {
            return [...prev.slice(0, index), data, ...prev.slice(index + 1)];
          }
          return [...prev, data];
        });

        toast.success('Opportunity tracked successfully');
      } catch (error) {
        console.error('Error tracking opportunity:', error);
        toast.error('Failed to track opportunity');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    userOffers,
    fetchUserOffers,
    trackOpportunity,
  };
}
