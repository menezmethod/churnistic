import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/opportunities/import - Starting request');

    // Verify authentication
    const { session } = await createAuthContext();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Parse request body
    const { offers } = await request.json();
    if (!Array.isArray(offers)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Offers must be an array' },
        { status: 400 }
      );
    }

    console.log(`Processing ${offers.length} offers for import`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Call the import_opportunities function
    const { data: result, error: importError } = await supabase.rpc(
      'import_opportunities',
      {
        p_offers: offers,
        p_user_email: session.user.email,
      }
    );

    if (importError) {
      console.error('Error importing opportunities:', importError);
      return NextResponse.json(
        { error: 'Failed to import opportunities', details: importError.message },
        { status: 500 }
      );
    }

    console.log('Import result:', result);

    return NextResponse.json({
      addedCount: result.added_count,
      totalCount: result.total_count,
      skippedCount: result.skipped_count,
      message: `Successfully imported ${result.added_count} offers (${result.skipped_count} skipped)`,
    });
  } catch (error: unknown) {
    console.error('Error importing opportunities:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
