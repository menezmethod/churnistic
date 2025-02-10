import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 PUT /api/opportunities/[id]/type - Starting request');
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update({ type: body.type })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating opportunity type:', error);
      return NextResponse.json(
        { error: 'Failed to update opportunity type' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity type updated:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in PUT /api/opportunities/[id]/type:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity type' },
      { status: 500 }
    );
  }
}
