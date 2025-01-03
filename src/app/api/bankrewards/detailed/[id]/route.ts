import { NextRequest, NextResponse } from 'next/server';

import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

type Context = {
  params: Promise<{ id: string | string[] | undefined }>;
};

export async function GET(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const db = new BankRewardsDatabase();
    const offers = await db.getOffers();
    
    // Find the specific offer by ID
    const params = await context.params;
    const offerId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
    const offer = offers.find((o) => o.id === offerId);
    
    if (!offer) {
      return NextResponse.json(
        {
          error: {
            message: 'Offer not found',
            details: `No offer found with ID: ${offerId}`,
          },
        },
        { status: 404 }
      );
    }

    // Always transform the offer for detailed endpoint
    const transformedOffer = new BankRewardsTransformer().transform(offer);

    return NextResponse.json({
      data: transformedOffer,
    });
  } catch (error) {
    console.error('Error fetching detailed BankRewards offer:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch offer',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 