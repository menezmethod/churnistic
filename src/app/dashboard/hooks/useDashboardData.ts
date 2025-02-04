import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { getFirebaseServices } from '@/lib/firebase/config';
import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

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

  // Get base URL for API calls
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Fetch profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { firestore } = await getFirebaseServices();
        const docRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    void fetchProfile();
  }, [user]);

  // Fetch stats from the API
  const { data: stats, error: statsError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/api/opportunities/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();

      // Format currency values
      const formattedTotalValue = formatCurrency(data.totalPotentialValue || 0);
      const formattedAvgValue = formatCurrency(data.averageValue || 0);

      // Transform API response to match dashboard format
      return {
        trackedValue: formattedTotalValue,
        potentialValue: formattedTotalValue,
        activeOpportunities: `${data.activeCount || 0}`,
        averageValue: formattedAvgValue,
        trends: {
          trackedValue: {
            value: data.approved || 0,
            label: 'opportunities in progress',
          },
          potentialValue: {
            value: data.highValue || 0,
            label: 'high-value opportunities',
          },
          activeOpportunities: {
            value: data.activeCount || 0,
            label: 'active opportunities',
          },
          averageValue: {
            value: data.averageValue || 0,
            label: 'average bonus value',
          },
        },
      };
    },
    enabled: !!user && !!baseUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch opportunities for the dashboard
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/api/opportunities`);
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      const data = await response.json();
      return data.opportunities || [];
    },
    enabled: !!user && !!baseUrl,
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
    loading: authLoading || loadingProfile || !stats,
    error: statsError,
  };
}

export default useDashboardData;
