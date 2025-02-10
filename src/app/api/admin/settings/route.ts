import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📥 GET /api/admin/settings - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin');

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    // Get system settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error fetching system settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch system settings' },
        { status: 500 }
      );
    }

    console.log('✅ System settings fetched:', settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('❌ Error in GET /api/admin/settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/admin/settings - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin');

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update system settings
    const { error } = await supabase.from('system_settings').upsert(
      {
        ...body,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('❌ Error updating system settings:', error);
      return NextResponse.json(
        { error: 'Failed to update system settings' },
        { status: 500 }
      );
    }

    console.log('✅ System settings updated');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
