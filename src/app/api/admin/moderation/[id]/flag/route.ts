import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 POST /api/admin/moderation/[id]/flag - Starting request');
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

    // Get the item type
    const { data: item } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', params.id)
      .single();

    const table = item ? 'opportunities' : 'staged_offers';

    // Update item status
    const { error } = await supabase
      .from(table)
      .update({
        status: 'flagged',
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
        metadata: {
          flagged_by: session.user.id,
          flagged_at: new Date().toISOString(),
        },
      })
      .eq('id', params.id);

    if (error) {
      console.error('❌ Error flagging item:', error);
      return NextResponse.json({ error: 'Failed to flag item' }, { status: 500 });
    }

    console.log('✅ Item flagged:', params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/moderation/[id]/flag:', error);
    return NextResponse.json({ error: 'Failed to flag item' }, { status: 500 });
  }
}
