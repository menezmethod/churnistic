import { type NextRequest, NextResponse } from 'next/server';

import {
  createServerSupabaseClient,
  createServerSupabaseAdmin,
} from '@/lib/supabase/server';

// Remove getAdminDb() and replace with Supabase client

// Replace Timestamp.now() with new Date().toISOString()

export async function GET() {
  try {
    console.log('📥 GET /api/users - Starting request');
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
    const { data: users, error } = await supabase
      .from('user_roles')
      .select('*, auth.users!inner(id, email, created_at, last_sign_in_at)');

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log('✅ Users fetched:', users);
    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const supabase = await createServerSupabaseAdmin();

    // Create user with auth admin
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role || 'user',
      },
    });

    if (authError) throw authError;

    // Create user role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: authUser.user.id,
      role: userData.role || 'user',
    });

    if (roleError) throw roleError;

    return NextResponse.json(authUser.user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ids, updates } = await request.json();
    const supabase = await createServerSupabaseAdmin();

    // Update each user
    const results = await Promise.all(
      ids.map(async (id: string) => {
        const { data, error } = await supabase.auth.admin.updateUserById(id, {
          user_metadata: updates,
        });
        if (error) throw error;
        return data.user;
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error updating users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    const supabase = await createServerSupabaseAdmin();

    // Delete each user
    await Promise.all(
      ids.map(async (id: string) => {
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
      })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
