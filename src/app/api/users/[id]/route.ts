import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, context: { params: Params }) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }

    return Response.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Params }) {
  try {
    const updates = await request.json();
    const supabase = await createClient();
    const { id } = await context.params;

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
