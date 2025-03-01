import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get active opportunities
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('opportunities')
      .select('value, status')
      .eq('status', 'active');

    if (opportunitiesError) {
      throw opportunitiesError;
    }

    // Calculate stats
    const activeCount = opportunities.length;
    const totalPotentialValue = opportunities.reduce(
      (sum, opp) => sum + parseFloat(opp.value?.toString() || '0'),
      0
    );
    const averageValue = activeCount > 0 ? totalPotentialValue / activeCount : 0;

    return NextResponse.json(
      {
        activeCount,
        totalPotentialValue,
        averageValue,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public stats' },
      {
        status:
          error instanceof Error && error.message.includes('environment') ? 500 : 503,
      }
    );
  }
}
