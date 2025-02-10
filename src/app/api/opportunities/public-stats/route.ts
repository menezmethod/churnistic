import { NextResponse } from 'next/server';

import { createServerSupabaseAdmin } from '@/lib/supabase/server';
import { Json } from '@/types/supabase';

interface OpportunityMetadata {
  value: number;
  [key: string]: Json | undefined;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    console.log('📥 GET /api/opportunities/public-stats - Starting request');
    const supabase = await createServerSupabaseAdmin();

    // Get active opportunities count and total value
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('metadata')
      .eq('status', 'approved');

    if (error) {
      console.error('❌ Error fetching opportunities:', error);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Calculate stats
    const activeCount = opportunities?.length || 0;
    const totalValue =
      opportunities?.reduce(
        (sum, opp) => sum + ((opp.metadata as OpportunityMetadata)?.value || 0),
        0
      ) || 0;
    const averageValue = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;

    const result = {
      activeCount,
      totalPotentialValue: totalValue,
      averageValue,
      lastUpdated: new Date().toISOString(),
    };

    console.log('✅ Public stats:', result);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/public-stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
