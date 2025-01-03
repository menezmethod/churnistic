import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

// Validation schema for query parameters
const getQuerySchema = z.object({
  format: z.enum(['detailed', 'simple']).optional(),
});

type Context = {
  params: { id: string | string[] | undefined };
};

export async function GET(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { format } = getQuerySchema.parse({
      format: searchParams.get('format') || 'simple',
    });

    const db = new BankRewardsDatabase();
    const offers = await db.getOffers();
    
    // Find the specific offer by ID
    const offerId = typeof context.params.id === 'string' ? context.params.id : Array.isArray(context.params.id) ? context.params.id[0] : '';
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

    // Transform the offer if detailed format is requested
    const transformedOffer =
      format === 'detailed'
        ? new BankRewardsTransformer().transform(offer)
        : offer;

    return NextResponse.json({
      data: transformedOffer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error fetching BankRewards offer:', error);
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
