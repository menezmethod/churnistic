import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8s timeout

    try {
      // Use the shared admin DB instance
      const db = getAdminDb();

      if (!db) {
        console.error('[STATS] Failed to get Firestore instance');
        return NextResponse.json(
          {
            error: 'Database connection failed',
            lastUpdated: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      // Fetch from both collections
      const [opportunitiesSnapshot, stagedSnapshot] = await Promise.all([
        db.collection('opportunities').get(),
        db.collection('staged_offers').get(),
      ]);

      // Initialize counters
      const stats = {
        total: opportunitiesSnapshot.size + stagedSnapshot.size,
        pending: stagedSnapshot.size,
        approved: 0,
        byType: { bank: 0, credit_card: 0, brokerage: 0 },
        totalValue: 0,
        approvedValue: 0,
        approvedCount: 0,
        highValueCount: 0,
      };

      // Process opportunities collection
      opportunitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        const value = parseFloat(data.value) || 0;

        if (data.status === 'approved') {
          stats.approved++;
          stats.approvedValue += value;

          // Count by type for approved offers only
          if (data.type === 'bank') stats.byType.bank++;
          if (data.type === 'credit_card') stats.byType.credit_card++;
          if (data.type === 'brokerage') stats.byType.brokerage++;

          // Count high value approved offers
          if (value >= 500) stats.highValueCount++;
        }

        stats.totalValue += value;
      });

      // Calculate averages and rates
      const avgValue =
        stats.approved > 0 ? Math.round(stats.approvedValue / stats.approved) : 0;

      const processingRate =
        stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

      const result = {
        total: stats.total,
        pending: stats.pending,
        approved: stats.approved,
        avgValue,
        processingRate,
        byType: stats.byType,
        highValue: stats.highValueCount,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Stats request timed out',
          lastUpdated: new Date().toISOString(),
        },
        { status: 504 }
      );
    }
    console.error('Stats endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
