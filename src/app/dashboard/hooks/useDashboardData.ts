import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

export interface UserProfile {
  id: string;
  email?: string;
  role?: string;
  updated_at?: string;
  customDisplayName?: string;
  displayName?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface DashboardStats {
  trackedValue: string;
  potentialValue: string;
  activeOpportunities: string;
  averageValue: string;
  trends: {
    trackedValue: { value: number; label: string };
    potentialValue: { value: number; label: string };
    activeOpportunities: { value: number; label: string };
    averageValue: { value: number; label: string };
  };
}

export interface DashboardOpportunity extends FirestoreOpportunity {
  status: 'active' | 'inactive';
  metadata: {
    tracked?: boolean;
    [key: string]: unknown;
  } & FirestoreOpportunity['metadata'];
  source: string;
  sourceLink: string;
  postedDate: string;
  confidence: number;
  id: string;
  title: string;
  bank: string;
  description: string;
}

export function useDashboardData() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setProfile({
          id: user.id,
          email: user.email,
          role: data.role,
          updated_at: data.updated_at || undefined,
          user_metadata: user.user_metadata,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    void fetchProfile();
  }, [user]);

  // TODO: Replace mock stats with real data after feature and tracking implementation
  const stats = {
    trackedValue: formatCurrency(1500),
    potentialValue: formatCurrency(5000),
    activeOpportunities: '3',
    averageValue: formatCurrency(1200),
    trends: {
      trackedValue: {
        value: 2,
        label: 'opportunities in progress',
      },
      potentialValue: {
        value: 1,
        label: 'high-value opportunities',
      },
      activeOpportunities: {
        value: 3,
        label: 'active opportunities',
      },
      averageValue: {
        value: 1200,
        label: 'average bonus value',
      },
    },
  };

  // Fetch opportunities for the dashboard
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await fetch('/api/opportunities');
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      const data = await response.json();
      return data.opportunities || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get quick opportunities (top 3 by value)
  const quickOpportunities = opportunities
    .filter((opp: DashboardOpportunity) => opp.status === 'active' && opp.value > 0)
    .sort((a: DashboardOpportunity, b: DashboardOpportunity) => b.value - a.value)
    .slice(0, 3);

  // Get tracked opportunities
  const trackedOpportunities = opportunities
    .filter(
      (opp: DashboardOpportunity) => opp.status === 'active' && opp.metadata?.tracked
    )
    .map((opp: DashboardOpportunity) => ({
      id: opp.id,
      title: opp.name || opp.title,
      type: opp.type === 'brokerage' ? 'bank_account' : opp.type,
      progress: Math.min(opp.value * 0.5, opp.value),
      target: opp.value,
      daysLeft: 30,
    }));

  return {
    user,
    profile,
    stats,
    quickOpportunities,
    trackedOpportunities,
    loading: authLoading || loadingProfile,
    error: null,
  };
}

export default useDashboardData;
