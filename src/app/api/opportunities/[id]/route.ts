import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
  }

  try {
    const { session } = await createAuthContext();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // First check if the opportunity exists and verify permissions
    const { data: existingOpp, error: fetchError } = await supabase
      .from('opportunities')
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
      throw fetchError;
    }

    const isAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isCreator = session.user.email === existingOpp.metadata?.created_by;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Not authorized to edit this opportunity' },
        { status: 403 }
      );
    }

    // Check for special actions in query params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reject') {
      // Start a transaction
      const { data: opportunity, error: getError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      // Move to rejected_offers
      const { error: rejectError } = await supabase.from('rejected_offers').insert([
        {
          ...opportunity,
          status: 'rejected',
          metadata: {
            ...opportunity.metadata,
            updated_at: new Date().toISOString(),
            updated_by: session.user.email,
            status: 'rejected',
          },
        },
      ]);

      if (rejectError) throw rejectError;

      // Delete from opportunities
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ success: true });
    }

    if (action === 'mark-for-review') {
      const { reason } = await request.json();
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          processing_status: {
            needs_review: true,
            review_reason: reason,
          },
          metadata: {
            updated_by: session.user.email,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true });
    }

    // Regular update logic
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      ...body,
      card_image:
        body.type === 'credit_card'
          ? {
              url: body.card_image?.url || '',
              network: body.card_image?.network || 'Unknown',
              color: body.card_image?.color || 'Unknown',
              badge: body.card_image?.badge,
            }
          : null,
      metadata: {
        ...(body.metadata || {}),
        updated_at: new Date().toISOString(),
        updated_by: session.user.email,
      },
    };

    // Update the opportunity
    const { data: updatedOpp, error: updateError } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedOpp);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
  }

  try {
    const { session } = await createAuthContext();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // First check if the opportunity exists and verify permissions
    const { data: opportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
      throw fetchError;
    }

    const isAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isCreator = session.user.email === opportunity.metadata?.created_by;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Not authorized to delete this opportunity' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
