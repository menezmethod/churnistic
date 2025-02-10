import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('📥 DELETE /api/roles/revoke - Starting request');
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
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Only super_admin can revoke admin roles
    if (role === 'admin' && !roles.some((r) => r.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Only super admins can revoke admin roles' },
        { status: 403 }
      );
    }

    // Cannot revoke super_admin role
    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin role cannot be revoked' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user_id)
      .eq('role', role);

    if (error) {
      console.error('❌ Error revoking role:', error);
      return NextResponse.json({ error: 'Failed to revoke role' }, { status: 500 });
    }

    console.log('✅ Role revoked for user:', user_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error in DELETE /api/roles/revoke:', error);
    return NextResponse.json({ error: 'Failed to revoke role' }, { status: 500 });
  }
}
