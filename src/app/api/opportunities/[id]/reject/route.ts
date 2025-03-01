import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const { session } = await createAuthContext();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get id from URL
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID', details: 'No ID provided in URL' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Start a transaction using RPC
    const { data: rejectedOpportunity, error: rejectError } = await supabase.rpc(
      'reject_opportunity_transaction',
      {
        p_opportunity_id: id,
        p_user_email: session.user.email,
      }
    );

    if (rejectError) {
      console.error('Error rejecting opportunity:', rejectError);
      return NextResponse.json(
        { error: 'Failed to reject opportunity', details: rejectError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully rejected opportunity',
      id,
      opportunity: rejectedOpportunity,
    });
  } catch (error) {
    console.error('Error rejecting opportunity:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
