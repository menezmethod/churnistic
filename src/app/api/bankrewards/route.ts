import { NextResponse } from 'next/server';

import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';

import { getBankRewardsConfig } from './config';

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

export async function GET() {
  try {
    const db = new BankRewardsDatabase();
    const offers = await db.getOffers();
    const stats = await db.getStats();

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
