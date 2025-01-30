'use client';

import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

export const useSplashStats = () => {
  const { opportunities = [] } = useOpportunities();

  // Get active opportunities
  const activeOpportunities = opportunities.filter(
    (opp: FirestoreOpportunity) => opp.metadata?.status === 'active'
  );

  // Calculate total potential value
  const totalPotentialValue = activeOpportunities.reduce(
    (sum: number, opp: FirestoreOpportunity) => sum + (typeof opp.value === 'number' ? opp.value : 0),
    0
  );

  // Calculate average value
  const averageValue =
    activeOpportunities.length > 0 ? totalPotentialValue / activeOpportunities.length : 0;

  return {
    stats: [
      {
        label: 'POTENTIAL BONUS EARNINGS',
        value: formatCurrency(totalPotentialValue),
      },
      {
        label: 'BONUSES AVAILABLE',
        value: `${activeOpportunities.length}+`,
      },
      {
        label: 'AVERAGE BONUS VALUE',
        value: formatCurrency(averageValue),
      },
    ],
  };
};
