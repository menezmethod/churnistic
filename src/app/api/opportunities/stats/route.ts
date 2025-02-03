import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { formatCurrency } from '@/lib/utils/formatters';
import { DashboardOpportunity, Opportunity } from '@/types/opportunity';

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic
export const revalidate = 300; // Revalidate every 5 minutes

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

    // Fetch opportunities in parallel
    const [opportunities, tracked] = await Promise.all([
      db.collection('opportunities').get(),
      db.collection('tracked_opportunities').get(),
    ]);

    // Get all opportunities with processed data
    const allOpportunities = opportunities.docs.map((doc) => {
      const data = doc.data() as Opportunity;
      const status =
        data.metadata?.status !== 'inactive' && data.status !== 'rejected'
          ? 'active'
          : 'inactive';

      return {
        ...data,
        id: doc.id,
        value: parseNumericValue(data.value),
        status,
        metadata: {
          ...data.metadata,
          tracked: tracked.docs.some((t) => t.id === doc.id),
        },
        source: data.metadata?.source?.name || 'Unknown',
        sourceLink: data.offer_link || '#',
        postedDate: data.metadata?.created_at || new Date().toISOString(),
        confidence: data.ai_insights?.confidence_score ?? 0,
        title: data.name || data.title || 'Untitled Opportunity',
        bank: data.bank || 'Unknown Bank',
        description: data.description || '',
      } as DashboardOpportunity;
    });

    // Get active opportunities
    const activeOpportunities = allOpportunities.filter(
      (opp) => opp.status === 'active' && opp.value > 0
    );

    // Calculate stats
    const activeCount = activeOpportunities.length;
    const roundedActiveCount = roundToNearest5(activeCount);
    const trackedCount = tracked.docs.length;

    const totalPotentialValue = activeOpportunities.reduce(
      (sum, opp) => sum + opp.value,
      0
    );

    const averageValue =
      activeCount > 0 ? Math.round(totalPotentialValue / activeCount) : 0;

    // High value opportunities (over $500)
    const highValue = activeOpportunities.filter((opp) => opp.value >= 500).length;

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

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
