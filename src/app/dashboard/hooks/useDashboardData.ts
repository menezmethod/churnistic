import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { formatCurrency } from '@/lib/utils/formatters';

export interface UserProfile {
  displayName?: string;
  customDisplayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  updatedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: string | number;
  bank: string;
  description: string;
  requirements: string[];
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
  metadata?: {
    progress?: number;
    target?: number;
    riskLevel?: number;
    riskFactors?: string[];
  };
  timeframe?: string;
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

export const useDashboardData = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: opportunities = [], isLoading: oppsLoading } = useOpportunities();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Transform opportunities data
  const transformedOpportunities = opportunities.map((opp) => ({
    id: opp.id || crypto.randomUUID(),
    value: typeof opp.value === 'number' ? opp.value : parseInt(opp.value),
    title: opp.name || opp.title || 'Untitled Opportunity',
    type: opp.type === 'bank' ? ('bank_account' as const) : ('credit_card' as const),
    bank: opp.bank || 'Unknown Bank',
    description: opp.bonus?.description || '',
    requirements: [opp.bonus?.requirements?.description || ''],
    status: opp.metadata?.status || 'active',
    source: opp.metadata?.created_by || 'Unknown',
    sourceLink: opp.offer_link || '',
    postedDate: opp.metadata?.created_at || new Date().toISOString(),
    expirationDate: opp.details?.expiration,
    confidence: 0.9, // We can implement real confidence scoring later
  }));

  // Get active opportunities sorted by value
  const activeOpportunities = transformedOpportunities
    .filter((opp) => opp.status === 'active')
    .sort((a, b) => b.value - a.value);

  // Get quick opportunities (top 3 by value)
  const quickOpportunities = activeOpportunities.slice(0, 3);

  // Calculate total potential value
  const totalPotentialValue = activeOpportunities.reduce(
    (sum, opp) => sum + opp.value,
    0
  );

  // Get tracked opportunities (opportunities with progress)
  const trackedOpportunities = transformedOpportunities
    .filter((opp) => opp.status === 'active')
    .map((opp) => ({
      id: opp.id,
      title: opp.title,
      type: opp.type as 'credit_card' | 'bank_account',
      progress: opp.value * 0.5, // For now, assume 50% progress
      target: opp.value,
      daysLeft: 30, // Default to 30 days for now
    }));

  // Calculate stats
  const stats: DashboardStats = {
    trackedValue: formatCurrency(
      trackedOpportunities.reduce((sum, opp) => sum + opp.progress, 0)
    ),
    potentialValue: formatCurrency(totalPotentialValue),
    activeOpportunities: activeOpportunities.length.toString(),
    averageValue: formatCurrency(
      totalPotentialValue / Math.max(activeOpportunities.length, 1)
    ),
    trends: {
      trackedValue: {
        value: trackedOpportunities.length,
        label: 'opportunities in progress',
      },
      potentialValue: {
        value: Math.round(totalPotentialValue / Math.max(activeOpportunities.length, 1)),
        label: 'avg per opportunity',
      },
      activeOpportunities: {
        value: Math.round((activeOpportunities.length / opportunities.length) * 100),
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

  return {
    user,
    profile,
    stats,
    quickOpportunities,
    trackedOpportunities,
    loading: authLoading || oppsLoading || loadingProfile,
  };
};

export default useDashboardData;
