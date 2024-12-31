import { NextResponse } from 'next/server';

import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';

import { getBankRewardsConfig } from '../config';

// Start collection
export async function POST() {
  try {
    const config = getBankRewardsConfig();
    const collector = new BankRewardsCollector(config);

    const result = await collector.collect();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running BankRewards collector:', error);
    return NextResponse.json(
      {
        error: 'Failed to run collector',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Get collection stats
export async function GET() {
  try {
    const database = new BankRewardsDatabase();
    const stats = await database.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting BankRewards stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to get stats',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Delete all offers
export async function DELETE() {
  try {
    const database = new BankRewardsDatabase();
    const result = await database.deleteAllOffers();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting BankRewards offers:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete offers',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
