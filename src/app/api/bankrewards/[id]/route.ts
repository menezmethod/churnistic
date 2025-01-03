import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

// Validation schema for query parameters
const querySchema = z.object({
  format: z.enum(['detailed', 'simple']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const { format } = querySchema.parse({
      format: searchParams.get('format') || 'simple',
    });

    // Get the offer ID from the URL parameters
    const { id } = params;

    // Initialize database and fetch all offers
    const db = new BankRewardsDatabase();
    const offers = await db.getOffers();

    // Find the specific offer
    const offer = offers.find((o) => o.id === id);

    // Return 404 if offer not found
    if (!offer) {
      return NextResponse.json(
        {
          error: {
            message: 'Offer not found',
            details: `No offer found with ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    // Transform the offer only if detailed format is requested
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

    console.error('Error fetching bank rewards offer:', error);
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
