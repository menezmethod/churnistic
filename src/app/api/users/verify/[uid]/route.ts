import { createClient } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', uid)
      .single();

    if (userError || !user) {
      return new Response('User not found', { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        business_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
