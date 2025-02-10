import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/roles/assign - Starting request');
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

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Only super_admin can assign admin roles
    if (role === 'admin' && !roles.some((r) => r.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Only super admins can assign admin roles' },
        { status: 403 }
      );
    }

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id,
        role: role as Database['public']['Enums']['user_role'],
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error assigning role:', error);
      return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
    }

    console.log('✅ Role assigned:', userRole);
    return NextResponse.json(userRole);
  } catch (error) {
    console.error('❌ Error in POST /api/roles/assign:', error);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}
