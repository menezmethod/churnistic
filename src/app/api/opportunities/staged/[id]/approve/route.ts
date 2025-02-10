import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 POST /api/opportunities/staged/[id]/approve - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to approve
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

    if (!staged.data) {
      return NextResponse.json(
        { error: 'Invalid staged opportunity data' },
        { status: 400 }
      );
    }

    // Start a transaction
    const { data: opportunity, error: createError } = await supabase
      .from('opportunities')
      .insert({
        ...(staged.data as Record<string, unknown>),
        status: 'approved',
        metadata: {
          ...((staged.data as Record<string, unknown>)?.metadata as Record<
            string,
            unknown
          >),
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating approved opportunity:', createError);
      return NextResponse.json(
        { error: 'Failed to create approved opportunity' },
        { status: 500 }
      );
    }

    // Update staged offer status
    const { error: updateError } = await supabase
      .from('staged_offers')
      .update({
        status: 'approved',
        opportunity_id: opportunity.id,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('❌ Error updating staged offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update staged offer' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity approved:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities/staged/[id]/approve:', error);
    return NextResponse.json({ error: 'Failed to approve opportunity' }, { status: 500 });
  }
}
