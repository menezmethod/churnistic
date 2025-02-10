import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/opportunities/staged - Starting request');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('staged_offers')
      .select('*, opportunities(*)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('❌ Error fetching staged opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staged opportunities' },
        { status: 500 }
      );
    }

    const result = {
      opportunities: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };

    console.log('✅ Staged opportunities fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/staged:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staged opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/opportunities/staged - Starting request');
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Store the original data
    const { data: staged, error } = await supabase
      .from('staged_offers')
      .insert({
        user_id: session.user.id,
        status: 'pending',
        firebase_data: body, // Store original data for reference
        validation_errors: null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating staged opportunity:', error);
      return NextResponse.json(
        { error: 'Failed to create staged opportunity' },
        { status: 500 }
      );
    }

    console.log('✅ Staged opportunity created:', staged);
    return NextResponse.json(staged);
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/staged:', error);
    return NextResponse.json(
      { error: 'Failed to create staged opportunity' },
      { status: 500 }
    );
  }
}
