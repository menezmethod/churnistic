'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Opportunity } from '@/types/opportunity';
import { DashboardOpportunity } from '@/types/opportunity';
import type { Database } from '@/types/supabase';

export interface UserProfile {
  displayName?: string;
  customDisplayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  updatedAt?: string;
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

export function useDashboardData() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile data using @supabase/ssr client
  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('display_name, email, photo_url, role, updated_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (data) {
          setProfile({
            displayName: data.display_name,
            email: data.email,
            photoURL: data.photo_url,
            role: data.role,
            updatedAt: data.updated_at,
          });
        }
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

  // Fetch opportunities for the dashboard using @supabase/ssr client
  const { data: opportunities = [], isLoading: isLoadingOpportunities, error: opportunitiesError } = useQuery({
    queryKey: ['dashboard-opportunities'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'active')
          .order('value', { ascending: false });

        if (error) {
          console.error('Error fetching opportunities:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in dashboard opportunities query:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
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
    loading: authLoading || loadingProfile || isLoadingOpportunities,
    error: opportunitiesError,
  };
}

export default useDashboardData;
