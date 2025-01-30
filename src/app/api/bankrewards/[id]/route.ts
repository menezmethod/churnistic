import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

import { verifySession } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/types';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

// Validation schema for query parameters
const querySchema = z.object({
  format: z.enum(['detailed', 'simple']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verify admin access
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const session = await verifySession(sessionCookie);
    if (
      !session ||
      (session.role !== UserRole.ADMIN && session.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const { format } = querySchema.parse({
      format: searchParams.get('format') || 'simple',
    });

    // Get the offer ID from the URL parameters
    const { id } = await params;

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
      format === 'detailed' ? new BankRewardsTransformer().transform(offer) : offer;

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
