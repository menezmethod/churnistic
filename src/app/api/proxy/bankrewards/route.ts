import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Add this interface at the top of the file
interface Offer {
  metadata?: {
    status: 'active' | 'expired';
  };
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
    if (!baseUrl) {
      console.error('BankRewards scraper URL is not configured');
      return NextResponse.json(
        { error: 'BankRewards scraper URL is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';

    const apiUrl = `${baseUrl}/api/bankrewards?format=${format}`;
    console.log('🔍 Proxy - Fetching from URL:', apiUrl);
    console.log('🔑 Proxy - Using base URL:', baseUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy - Scraper API error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        response: errorText,
      });

      return NextResponse.json(
        { error: `Scraper API error: ${response.status} ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();

    // Log the raw response
    console.log('📦 Proxy - Raw scraper response:', JSON.stringify(data, null, 2));

    // Transform the response if needed
    const transformedData = {
      data: {
        stats: data.data?.stats || {
          total: data.data?.offers?.length || 0,
          active:
            data.data?.offers?.filter((o: Offer) => o.metadata?.status === 'active')
              ?.length || 0,
          expired:
            data.data?.offers?.filter((o: Offer) => o.metadata?.status === 'expired')
              ?.length || 0,
        },
        offers: data.data?.offers || [],
      },
    };

    console.log(
      `✅ Proxy - Successfully transformed data with ${transformedData.data.offers.length} offers and stats:`,
      transformedData.data.stats
    );

    return NextResponse.json(transformedData, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ Proxy - Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch from BankRewards API',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BANKREWARDS_SCRAPER_URL;
    if (!baseUrl) {
      console.error('BankRewards scraper URL is not configured');
      return NextResponse.json(
        { error: 'BankRewards scraper URL is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const apiUrl = `${baseUrl}/api/bankrewards/collect`;
    console.log('🔍 Proxy - Collecting from URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy - Scraper API error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        response: errorText,
      });

      return NextResponse.json(
        { error: `Scraper API error: ${response.status} ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    console.log('📦 Proxy - Collection response:', JSON.stringify(data, null, 2));

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ Proxy - Collection error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to collect from BankRewards API',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export const dynamic = 'force-dynamic';
