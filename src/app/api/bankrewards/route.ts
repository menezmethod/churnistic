import { NextRequest, NextResponse } from 'next/server';

import { getBankRewardsConfig } from './config';

import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

export async function POST() {
  try {
    const config = getBankRewardsConfig();
    const collector = new BankRewardsCollector(config);
    const result = await collector.collect();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running BankRewards scraper:', error);
    return NextResponse.json(
      {
        error: 'Failed to run scraper',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');
    const db = new BankRewardsDatabase();
    const offers = await db.getOffers();
    const stats = await db.getStats();

    // If detailed format is requested, transform the offers
    if (format === 'detailed') {
      const transformer = new BankRewardsTransformer();
      const transformedOffers = offers.map((offer) => transformer.transform(offer));

      return NextResponse.json({
        success: true,
        stats,
        offers: transformedOffers,
      });
    }

    // Otherwise return original format
    return NextResponse.json({
      success: true,
      stats,
      offers,
    });
  } catch (error) {
    console.error('Error fetching BankRewards offers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch offers',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
