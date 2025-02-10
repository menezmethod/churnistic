import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

const rolePermissions = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access with ability to manage all roles and features',
    permissions: [
      'manage_roles',
      'manage_users',
      'manage_opportunities',
      'manage_system',
      'view_analytics',
      'manage_ai',
    ],
  },
  admin: {
    name: 'Admin',
    description: 'Administrative access to manage users and content',
    permissions: ['manage_users', 'manage_opportunities', 'view_analytics', 'manage_ai'],
  },
  contributor: {
    name: 'Contributor',
    description: 'Can manage opportunities and AI functions',
    permissions: ['manage_opportunities', 'manage_ai'],
  },
  user: {
    name: 'User',
    description: 'Basic user access',
    permissions: ['submit_opportunities', 'track_opportunities'],
  },
};

export async function GET() {
  try {
    console.log('📥 GET /api/roles/permissions - Starting request');
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

    console.log('✅ Role permissions fetched');
    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error('❌ Error in GET /api/roles/permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions' },
      { status: 500 }
    );
  }
}
