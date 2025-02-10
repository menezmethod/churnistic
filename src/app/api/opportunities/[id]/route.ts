import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 GET /api/opportunities/[id] - Starting request');
    const supabase = createServerSupabaseClient();

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ Error fetching opportunity:', error);
      return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
    }

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    console.log('✅ Opportunity fetched:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 PUT /api/opportunities/[id] - Starting request');
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating opportunity:', error);
      return NextResponse.json(
        { error: 'Failed to update opportunity' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity updated:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in PUT /api/opportunities/[id]:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 DELETE /api/opportunities/[id] - Starting request');
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from('opportunities').delete().eq('id', params.id);

    if (error) {
      console.error('❌ Error deleting opportunity:', error);
      return NextResponse.json(
        { error: 'Failed to delete opportunity' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity deleted:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error in DELETE /api/opportunities/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
