import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

import { getBankRewardsConfig } from './config';

// Validation schemas
const getQuerySchema = z.object({
  format: z.enum(['detailed', 'simple']).optional(),
  type: z.enum(['credit_card', 'bank', 'brokerage']).optional().nullable(),
});

export async function POST() {
  try {
    const config = getBankRewardsConfig();
    const collector = new BankRewardsCollector(config);
    const result = await collector.collect();

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error('Error running BankRewards scraper:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to run scraper',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { format, type } = getQuerySchema.parse({
      format: searchParams.get('format') || 'simple',
      type: searchParams.get('type') || null,
    });

    const db = new BankRewardsDatabase();
    let offers = await db.getOffers();

    // Update the type filtering logic
    if (type) {
      offers = offers.filter((offer) => {
        const offerType = offer.type.toLowerCase();
        switch (type) {
          case 'credit_card':
            return offerType === 'credit_card' || offerType === 'cr';
          case 'bank':
            return (
              offerType === 'bank' ||
              offerType === 'bank_account' ||
              offerType === 'checking' ||
              offerType === 'savings'
            );
          case 'brokerage':
            return offerType === 'brokerage' || offerType === 'investment';
          default:
            return false;
        }
      });
    }

    // If detailed format is requested, transform the offers
    const transformedOffers =
      format === 'detailed'
        ? offers.map((offer) => new BankRewardsTransformer().transform(offer))
        : offers;

    return NextResponse.json({
      data: {
        stats: { total: offers.length, active: offers.length, expired: 0 },
        offers: transformedOffers,
      },
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

    console.error('Error fetching BankRewards offers:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch offers',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
