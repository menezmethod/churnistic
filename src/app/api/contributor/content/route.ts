import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/contributor/content - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is contributor/admin/super_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Contributor access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get content items
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('❌ Error fetching content items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content items' },
        { status: 500 }
      );
    }

    console.log('✅ Content items fetched:', items);
    return NextResponse.json(items);
  } catch (error) {
    console.error('❌ Error in GET /api/contributor/content:', error);
    return NextResponse.json({ error: 'Failed to fetch content items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/contributor/content - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is contributor/admin/super_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Contributor access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Create content item
    const { data: item, error } = await supabase
      .from('opportunities')
      .insert({
        ...body,
        status: 'draft',
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating content item:', error);
      return NextResponse.json(
        { error: 'Failed to create content item' },
        { status: 500 }
      );
    }

    console.log('✅ Content item created:', item);
    return NextResponse.json(item);
  } catch (error) {
    console.error('❌ Error in POST /api/contributor/content:', error);
    return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📥 PUT /api/contributor/content - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is contributor/admin/super_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Contributor access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    // Update content item
    const { data: item, error } = await supabase
      .from('opportunities')
      .update({
        ...updates,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('created_by', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating content item:', error);
      return NextResponse.json(
        { error: 'Failed to update content item' },
        { status: 500 }
      );
    }

    console.log('✅ Content item updated:', item);
    return NextResponse.json(item);
  } catch (error) {
    console.error('❌ Error in PUT /api/contributor/content:', error);
    return NextResponse.json({ error: 'Failed to update content item' }, { status: 500 });
  }
}
