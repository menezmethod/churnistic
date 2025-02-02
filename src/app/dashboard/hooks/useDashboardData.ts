import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
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

// Define a strict type for transformed opportunities
export interface TransformedOpportunity {
  id: string;
  value: number; // Always a number after transformation
  title: string;
  type: 'credit_card' | 'bank_account' | 'brokerage';
  bank: string;
  description: string;
  requirements: string[];
  status: 'active' | 'inactive';
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
}

export interface TrackedOpportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  progress: number;
  target: number;
  daysLeft: number;
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
  const { opportunities, isLoading: oppsLoading } = useOpportunities();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Helper function to convert value to number
  const toNumber = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Helper function to ensure type is one of the allowed values
  const normalizeType = (type: string | undefined): TransformedOpportunity['type'] => {
    if (type === 'bank') return 'bank_account';
    if (type === 'credit_card' || type === 'bank_account' || type === 'brokerage') {
      return type;
    }
    return 'bank_account'; // default value
  };

  // Transform opportunities data with proper typing
  const transformedOpportunities: TransformedOpportunity[] = opportunities.map(
    (opp: FirestoreOpportunity) => ({
      id: opp.id || crypto.randomUUID(),
      value: toNumber(opp.value),
      title: opp.name || opp.title || 'Untitled Opportunity',
      type: normalizeType(opp.type),
      bank: opp.bank || 'Unknown Bank',
      description: opp.bonus?.description || '',
      requirements: [
        opp.bonus?.requirements?.[0]?.description || 'No requirements specified',
      ],
      status: opp.metadata?.status === 'active' ? 'active' : 'inactive',
      source: opp.metadata?.created_by || 'Unknown',
      sourceLink: opp.offer_link || '',
      postedDate: opp.metadata?.created_at || new Date().toISOString(),
      expirationDate: opp.details?.expiration,
      confidence: 0.9,
    })
  );

  // Get active opportunities sorted by value
  const activeOpportunities = transformedOpportunities
    .filter((opp) => opp.status === 'active')
    .sort((a, b) => b.value - a.value);

  // Get quick opportunities (top 3 by value)
  const quickOpportunities = activeOpportunities.slice(0, 3);

  // Calculate total potential value (ensure we don't divide by zero)
  const totalPotentialValue = activeOpportunities.reduce(
    (sum, opp) => sum + opp.value,
    0
  );

  const numActiveOpportunities = Math.max(activeOpportunities.length, 1);

  // Get tracked opportunities (opportunities with progress)
  const trackedOpportunities: TrackedOpportunity[] = transformedOpportunities
    .filter((opp) => opp.status === 'active')
    .map((opp) => {
      const numericValue = opp.value; // Already a number from transformation
      return {
        id: opp.id,
        title: opp.title,
        type: opp.type === 'brokerage' ? 'bank_account' : opp.type,
        progress: Math.min(numericValue * 0.5, numericValue),
        target: numericValue,
        daysLeft: 30,
      };
    });

  // Calculate stats with safe math operations
  const stats: DashboardStats = {
    trackedValue: formatCurrency(
      trackedOpportunities.reduce((sum, opp) => sum + (opp.progress || 0), 0)
    ),
    potentialValue: formatCurrency(totalPotentialValue),
    activeOpportunities: activeOpportunities.length.toString(),
    averageValue: formatCurrency(totalPotentialValue / numActiveOpportunities),
    trends: {
      trackedValue: {
        value: trackedOpportunities.length,
        label: 'opportunities in progress',
      },
      potentialValue: {
        value: Math.round(totalPotentialValue / numActiveOpportunities),
        label: 'avg per opportunity',
      },
      activeOpportunities: {
        value:
          opportunities.length > 0
            ? Math.round((activeOpportunities.length / opportunities.length) * 100)
            : 0,
        label: 'of total opportunities',
      },
      averageValue: {
        value: quickOpportunities.length,
        label: 'high-value opportunities',
      },
    },
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
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

  const fetchDashboardStats = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/api/opportunities/stats`);

    if (!response.ok) {
      throw new Error('Failed to load dashboard data');
    }

    const stats = await response.json();
    return {
      potentialValue: stats.totalPotentialValue,
      activeOpportunities: stats.activeCount,
      averageValue: stats.averageValue,
      trends: {
        trackedValue: { value: stats.trackedCount || 0, label: 'opportunities tracked' },
        potentialValue: {
          value: stats.highValue || 0,
          label: 'high-value opportunities',
        },
        activeOpportunities: {
          value: stats.activeCount || 0,
          label: 'active opportunities',
        },
        averageValue: {
          value: Math.round(stats.averageValue || 0),
          label: 'average bonus value',
        },
      },
    };
  };

  const query = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // 1 minute
  });

  return {
    user,
    profile,
    stats,
    quickOpportunities,
    trackedOpportunities,
    loading: authLoading || oppsLoading || loadingProfile,
    query,
  };
}

export default useDashboardData;
