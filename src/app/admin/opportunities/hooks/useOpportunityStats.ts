import { useMemo } from 'react';

import { Opportunity, OpportunityStats } from '../types/opportunity';

export const useOpportunityStats = (opportunities: Opportunity[]): OpportunityStats => {
  return useMemo(() => {
    const stats: OpportunityStats = {
      total: opportunities.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      avgValue: 0,
      highValue: 0,
      byType: {
        bank: 0,
        credit_card: 0,
        brokerage: 0,
      },
    };

    if (opportunities.length === 0) {
      return stats;
    }

    let totalValue = 0;

    opportunities.forEach((opp) => {
      // Count by status
      if (opp.status === 'pending') stats.pending++;
      if (opp.status === 'approved') stats.approved++;
      if (opp.status === 'rejected') stats.rejected++;

      // Count by type
      if (opp.type === 'bank') stats.byType.bank++;
      if (opp.type === 'credit_card') stats.byType.credit_card++;
      if (opp.type === 'brokerage') stats.byType.brokerage++;

      // Track value metrics
      totalValue += opp.value;
      if (opp.value >= 500) stats.highValue++;
    });

    stats.avgValue = Math.round(totalValue / opportunities.length);

    return stats;
  }, [opportunities]);
};
