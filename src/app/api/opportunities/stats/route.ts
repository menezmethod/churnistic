import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { formatCurrency } from '@/lib/utils/formatters';
import { Opportunity } from '@/types/opportunity';

// Helper function to round to nearest 5
function roundToNearest5(num: number): number {
  return Math.ceil(num / 5) * 5;
}

// Helper function to safely parse numeric values
function parseNumericValue(value: string | number | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function GET() {
  try {
    const db = getAdminDb();
    const [opportunities, tracked] = await Promise.all([
      db.collection('opportunities').get(),
      db.collection('tracked_opportunities').get(),
    ]);

    // Get all opportunities
    const allOpportunities = opportunities.docs.map((doc) => {
      const data = doc.data() as Opportunity;
      return {
        ...data,
        id: doc.id,
        value: parseNumericValue(data.value), // Ensure value is numeric
      };
    });

    console.log('Total opportunities:', allOpportunities.length);
    console.log('Sample opportunity fields:', Object.keys(allOpportunities[0] || {}));
    console.log('Sample opportunity metadata:', allOpportunities[0]?.metadata);

    // Get active opportunities - adjust filter based on actual data structure
    const activeOpportunities = allOpportunities.filter((opp) => {
      const isActive =
        opp.metadata?.status !== 'inactive' && opp.status !== 'rejected' && opp.value > 0;

      if (isActive) {
        console.log('Found active opportunity:', {
          id: opp.id,
          name: opp.name,
          value: opp.value,
          status: opp.status,
          metadataStatus: opp.metadata?.status,
        });
      }

      return isActive;
    });

    console.log('Active opportunities:', activeOpportunities.length);
    if (activeOpportunities.length > 0) {
      console.log('Sample active opportunity:', {
        id: activeOpportunities[0].id,
        name: activeOpportunities[0].name,
        value: activeOpportunities[0].value,
        type: activeOpportunities[0].type,
      });
    }

    // Calculate stats
    const activeCount = activeOpportunities.length;
    const roundedActiveCount = roundToNearest5(activeCount);
    const trackedCount = tracked.docs.length;

    const totalPotentialValue = activeOpportunities.reduce((sum, opp) => {
      const value =
        typeof opp.value === 'string' ? parseFloat(opp.value) : opp.value || 0;
      console.log('Adding value:', { id: opp.id, name: opp.name, value });
      return sum + value;
    }, 0);

    const averageValue =
      activeCount > 0 ? Math.round(totalPotentialValue / activeCount) : 0;

    // High value opportunities (over $500)
    const highValue = activeOpportunities.filter((opp) => {
      const value =
        typeof opp.value === 'string' ? parseFloat(opp.value) : opp.value || 0;
      return value >= 500;
    }).length;

    // Calculate type distribution
    const byType = {
      bank: activeOpportunities.filter((opp) => opp.type === 'bank').length,
      credit_card: activeOpportunities.filter((opp) => opp.type === 'credit_card').length,
      brokerage: activeOpportunities.filter((opp) => opp.type === 'brokerage').length,
    };

    const response = {
      // Basic stats
      activeCount: roundedActiveCount,
      trackedCount,
      totalPotentialValue: formatCurrency(totalPotentialValue),
      averageValue: formatCurrency(averageValue),
      highValue,

      // Distribution stats
      byType,

      // Additional stats
      total: allOpportunities.length,
      approved: activeOpportunities.length,

      // Metadata
      lastUpdated: new Date().toISOString(),
    };

    console.log('Final response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
