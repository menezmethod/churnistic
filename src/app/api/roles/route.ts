import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📥 GET /api/roles - Starting request');
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

    // Get all users with their roles
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('*, auth.users!inner(id, email)');

    if (error) {
      console.error('❌ Error fetching user roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    console.log('✅ User roles fetched:', userRoles);
    return NextResponse.json(userRoles);
  } catch (error) {
    console.error('❌ Error in GET /api/roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
