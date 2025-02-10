import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/opportunities/import - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to import
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { offers } = body;

    if (!Array.isArray(offers)) {
      return NextResponse.json(
        { error: 'Invalid request - offers must be an array' },
        { status: 400 }
      );
    }

    // Import opportunities in batches
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < offers.length; i += batchSize) {
      batches.push(offers.slice(i, i + batchSize));
    }

    const results = await Promise.all(
      batches.map(async (batch) => {
        const { data, error } = await supabase
          .from('opportunities')
          .upsert(
            batch.map((offer) => ({
              ...offer,
              created_by: session.user.id,
              updated_by: session.user.id,
            }))
          )
          .select();

        if (error) throw error;
        return data;
      })
    );

    const importedOpportunities = results.flat();

    console.log('✅ Opportunities imported:', importedOpportunities.length);
    return NextResponse.json({
      success: true,
      count: importedOpportunities.length,
      opportunities: importedOpportunities,
    });
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/import:', error);
    return NextResponse.json(
      { error: 'Failed to import opportunities' },
      { status: 500 }
    );
  }
}
