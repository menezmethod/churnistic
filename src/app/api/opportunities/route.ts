import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/opportunities - Starting request');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('opportunities').select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type as Database['public']['Enums']['opportunity_type']);
    }

    // Apply sorting
    query = query.order(sortBy, {
      ascending: sortDirection === 'asc',
    });

    // Apply pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('❌ Error fetching opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
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

    console.log('✅ Opportunities fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/opportunities - Starting request');
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating opportunity:', error);
      return NextResponse.json(
        { error: 'Failed to create opportunity' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity created:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}
