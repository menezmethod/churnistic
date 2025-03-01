import { createClient } from '@supabase/supabase-js';

import { createAuthContext } from '@/lib/auth/authUtils';
import type { Database } from '@/types/supabase';

export async function POST() {
  try {
    const { session } = await createAuthContext();
    if (!session?.user?.id || !session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Call the initialize_user_claims function
    const { data: claims, error: claimsError } = await supabase.rpc(
      'initialize_user_claims',
      {
        p_user_id: session.user.id,
        p_email: session.user.email,
      }
    );

    if (claimsError) {
      console.error('Error initializing claims:', claimsError);
      throw claimsError;
    }

    return new Response(JSON.stringify({ success: true, claims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing claims:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const dynamic = 'force-dynamic';
