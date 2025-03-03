import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the session context
    const { session } = await createAuthContext();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('stats');

    if (error) {
      throw error;
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    console.error('Error in stats API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStatus = (error as { status?: number })?.status || 500;

    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
