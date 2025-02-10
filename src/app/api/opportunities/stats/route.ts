import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📥 GET /api/opportunities/stats - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get total opportunities count
    const { count: totalCount, error: totalError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error getting total count:', totalError);
      return NextResponse.json(
        { error: 'Failed to get opportunities stats' },
        { status: 500 }
      );
    }

    // Get counts by status
    const { data: statusData } = await supabase.from('opportunities').select('status');

    const statusCounts =
      statusData?.reduce(
        (acc: Record<string, number>, curr: { status: string }) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get counts by type
    const { data: typeData } = await supabase.from('opportunities').select('type');

    const typeCounts =
      typeData?.reduce(
        (acc: Record<string, number>, curr: { type: string | null }) => {
          if (curr.type) {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get latest opportunities
    const { data: latest, error: latestError } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (latestError) {
      console.error('❌ Error getting latest opportunities:', latestError);
      return NextResponse.json(
        { error: 'Failed to get opportunities stats' },
        { status: 500 }
      );
    }

    const stats = {
      total: totalCount || 0,
      byStatus: statusCounts || {},
      byType: typeCounts || {},
      latest: latest || [],
    };

    console.log('✅ Opportunities stats:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/stats:', error);
    return NextResponse.json(
      { error: 'Failed to get opportunities stats' },
      { status: 500 }
    );
  }
}
