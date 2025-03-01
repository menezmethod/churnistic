import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { session } = await createAuthContext();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Parse request body
    const opportunity = await request.json();
    if (!opportunity?.id) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Opportunity ID is required' },
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
    const { data: approvedOpportunity, error: approveError } = await supabase.rpc(
      'approve_opportunity',
      {
        opportunity_id: opportunity.id,
        user_email: session.user.email,
        opportunity_data: {
          ...opportunity,
          status: 'approved',
          metadata: {
            ...(opportunity.metadata || {}),
            created_by: session.user.email,
            updated_by: session.user.email,
            updated_at: new Date().toISOString(),
            status: 'active',
          },
        },
      }
    );

    if (approveError) {
      console.error('Error approving opportunity:', approveError);
      return NextResponse.json(
        { error: 'Failed to approve opportunity', details: approveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity approved successfully',
      opportunity: approvedOpportunity,
    });
  } catch (error: unknown) {
    console.error('Error approving opportunity:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
