import { NextRequest, NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { getAdminAuth } from '@/lib/firebase/admin';
import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';

import { getBankRewardsConfig } from '../config';

async function verifyAdminAccess(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return false;
  }

  try {
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return (
      decodedClaims.role === UserRole.ADMIN ||
      decodedClaims.role === UserRole.SUPERADMIN ||
      decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    );
  } catch (error) {
    console.error('Admin verification failed:', error);
    return false;
  }
}

// Start collection
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
