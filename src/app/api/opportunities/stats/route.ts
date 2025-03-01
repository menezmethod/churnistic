import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Fetch from opportunities table with proper typing
    const [
      { data: opportunities, error: opportunitiesError },
      { data: stagedOffers, error: stagedError },
    ] = await Promise.all([
      supabase.from('opportunities').select('*'),
      supabase.from('staged_offers').select('*'),
    ]);

    if (opportunitiesError) throw opportunitiesError;
    if (stagedError) throw stagedError;

    // Initialize counters
    const stats = {
      total: (opportunities?.length || 0) + (stagedOffers?.length || 0),
      pending: stagedOffers?.length || 0,
      approved: 0,
      byType: { bank: 0, credit_card: 0, brokerage: 0 },
      totalValue: 0,
      approvedValue: 0,
      approvedCount: 0,
      highValueCount: 0,
    };

    // Process opportunities
    opportunities?.forEach((data) => {
      const value = parseFloat(data.value?.toString() || '0');

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
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      {
        status:
          error instanceof Error && error.message.includes('environment') ? 500 : 503,
      }
    );
  }
}
