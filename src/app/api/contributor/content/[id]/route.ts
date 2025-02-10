import { type NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 DELETE /api/contributor/content/[id] - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is contributor/admin/super_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin', 'contributor']);

    if (!roles?.length) {
      return NextResponse.json(
        { error: 'Unauthorized - Contributor access required' },
        { status: 403 }
      );
    }

    // Delete content item
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', params.id)
      .eq('created_by', session.user.id);

    if (error) {
      console.error('❌ Error deleting content item:', error);
      return NextResponse.json(
        { error: 'Failed to delete content item' },
        { status: 500 }
      );
    }

    console.log('✅ Content item deleted:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Error in DELETE /api/contributor/content/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete content item' }, { status: 500 });
  }
}
