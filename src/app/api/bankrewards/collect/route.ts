import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { verifySession } from '@/lib/auth/session';
import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';

import { getBankRewardsConfig } from '../config';

// Validation schema for query parameters
const querySchema = z.object({
  action: z.enum(['collect', 'stats']).default('collect'),
});

// Combined GET handler for both collection and stats
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 403 }
      );
    }

    const session = await verifySession(sessionCookie);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 403 }
      );
    }

    if (!session.isAdmin && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const { action } = querySchema.parse({
      action: searchParams.get('action') || 'collect',
    });

    if (action === 'collect') {
      const config = getBankRewardsConfig();
      const collector = new BankRewardsCollector(config);
      const result = await collector.collect();
      return NextResponse.json(result);
    } else {
      const database = new BankRewardsDatabase();
      const stats = await database.getStats();
      return NextResponse.json(stats);
    }
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

    console.error('Error in BankRewards operation:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Operation failed',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

// Delete all offers
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 403 }
      );
    }

    const session = await verifySession(sessionCookie);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 403 }
      );
    }

    if (!session.isAdmin && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
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
