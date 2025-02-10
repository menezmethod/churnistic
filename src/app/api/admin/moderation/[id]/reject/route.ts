import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 POST /api/admin/moderation/[id]/reject - Starting request');
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
    const reason = body.reason || 'No reason provided';

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
        status: 'rejected',
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
        metadata: {
          rejected_by: session.user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        },
      })
      .eq('id', params.id);

    if (error) {
      console.error('❌ Error rejecting item:', error);
      return NextResponse.json({ error: 'Failed to reject item' }, { status: 500 });
    }

    console.log('✅ Item rejected:', params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in POST /api/admin/moderation/[id]/reject:', error);
    return NextResponse.json({ error: 'Failed to reject item' }, { status: 500 });
  }
}
