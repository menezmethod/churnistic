import { NextResponse } from 'next/server';

import { createServerSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseAdmin();

    // Check if role already exists
    const { data: existingRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching role:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingRole) {
      // Role already exists, return it
      return NextResponse.json({ role: existingRole.role });
    }

    // Create new role
    const role = email === 'menezfd@gmail.com' ? 'super_admin' : 'user';

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role })
      .single();

    if (insertError) {
      // If it's a duplicate key error, the role was created in a race condition
      if (insertError.code === '23505') {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        return NextResponse.json({ role: role?.role });
      }

      console.error('Error creating role:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ role });
  } catch (err) {
    console.error('Error in role creation:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 