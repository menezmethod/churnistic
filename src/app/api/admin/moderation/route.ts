import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/admin/moderation - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/super_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'opportunity';
    const status = searchParams.get('status');

    // Get items for moderation
    let query = supabase
      .from(type === 'opportunity' ? 'opportunities' : 'staged_offers')
      .select(
        `
        id,
        title,
        description,
        status,
        created_at,
        created_by:user_id (
          id,
          email
        ),
        metadata
      `
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('❌ Error fetching moderation items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch moderation items' },
        { status: 500 }
      );
    }

    console.log('✅ Moderation items fetched:', items);
    return NextResponse.json(items);
  } catch (error) {
    console.error('❌ Error in GET /api/admin/moderation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation items' },
      { status: 500 }
    );
  }
}
