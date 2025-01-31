import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';

import { getBankRewardsConfig } from '../config';

// Start collection
export async function POST() {
  try {
    const config = getBankRewardsConfig();
    const collector = new BankRewardsCollector(config);
    const result = await collector.collect();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error running BankRewards collector:', error);
    return NextResponse.json({ error: 'Failed to run collector' }, { status: 500 });
  }
}

// Get collection stats
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('bankrewards').get();

    return NextResponse.json({
      total: snapshot.size,
      status: 'success',
    });
  } catch (error) {
    console.error('Error getting BankRewards stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
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
