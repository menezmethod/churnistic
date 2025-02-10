import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📥 PUT /api/opportunities/[id]/status - Starting request');
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update({ status: body.status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating opportunity status:', error);
      return NextResponse.json(
        { error: 'Failed to update opportunity status' },
        { status: 500 }
      );
    }

    console.log('✅ Opportunity status updated:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('❌ Error in PUT /api/opportunities/[id]/status:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity status' },
      { status: 500 }
    );
  }
}
