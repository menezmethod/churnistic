import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call the reset_opportunities RPC function
    const { data, error } = await supabase.rpc('reset_opportunities', {
      admin_id: user.id,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Successfully reset opportunities',
      data,
    });
  } catch (error) {
    console.error('Error resetting opportunities:', error);
    return NextResponse.json({ error: 'Error resetting opportunities' }, { status: 500 });
  }
}
