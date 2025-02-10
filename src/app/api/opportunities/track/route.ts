import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/opportunities/track - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunity_id, status, notes, reminder_date } = body;

    if (!opportunity_id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const { data: userOffer, error } = await supabase
      .from('user_offers')
      .upsert(
        {
          user_id: session.user.id,
          opportunity_id,
          status: status as Database['public']['Enums']['tracking_status'],
          notes,
          reminder_date,
          ...(status === 'applied' && { applied_date: new Date().toISOString() }),
          ...(status === 'completed' && { completed_date: new Date().toISOString() }),
        },
        { onConflict: 'user_id,opportunity_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error tracking opportunity:', error);
      return NextResponse.json({ error: 'Failed to track opportunity' }, { status: 500 });
    }

    console.log('✅ Opportunity tracked:', userOffer);
    return NextResponse.json(userOffer);
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/track:', error);
    return NextResponse.json({ error: 'Failed to track opportunity' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/opportunities/track - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | Database['public']['Enums']['tracking_status']
      | null;

    let query = supabase
      .from('user_offers')
      .select('*, opportunities(*)')
      .eq('user_id', session.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: userOffers, error } = await query;

    if (error) {
      console.error('❌ Error fetching tracked opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tracked opportunities' },
        { status: 500 }
      );
    }

    console.log('✅ Tracked opportunities fetched:', userOffers);
    return NextResponse.json(userOffers);
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracked opportunities' },
      { status: 500 }
    );
  }
}
