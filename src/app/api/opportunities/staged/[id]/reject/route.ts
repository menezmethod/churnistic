import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 POST /api/opportunities/staged/[id]/reject - Starting request');
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to reject
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reason = body.reason || 'No reason provided';

    // Get the staged offer
    const { data: staged, error: stagedError } = await supabase
      .from('staged_offers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (stagedError || !staged) {
      console.error('❌ Error fetching staged opportunity:', stagedError);
      return NextResponse.json(
        { error: 'Staged opportunity not found' },
        { status: 404 }
      );
    }

    // Update staged offer status
    const { error: updateError } = await supabase
      .from('staged_offers')
      .update({
        status: 'rejected',
        validation_errors: {
          reason,
          rejected_by: session.user.id,
          rejected_at: new Date().toISOString(),
        },
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('❌ Error updating staged offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject staged offer' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity rejected:', { id: params.id, reason });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/staged/[id]/reject:', error);
    return NextResponse.json({ error: 'Failed to reject opportunity' }, { status: 500 });
  }
}
