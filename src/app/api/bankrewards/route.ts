import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { verifySession } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/types';
import { BankRewardsCollector } from '@/lib/scrapers/bankrewards/collector';
import { BankRewardsDatabase } from '@/lib/scrapers/bankrewards/database';
import { BankRewardsTransformer } from '@/lib/scrapers/bankrewards/transformer';

import { getBankRewardsConfig } from './config';

// Validation schemas
const getQuerySchema = z.object({
  format: z.enum(['detailed', 'simple']).optional(),
  type: z.enum(['credit_card', 'bank', 'brokerage']).optional().nullable(),
});

async function verifyAdminAccess(request: NextRequest) {
  // Skip auth check in development/emulator mode
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    return true;
  }

  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return false;
  }

  const session = await verifySession(sessionCookie);
  return (
    !!session &&
    (session.role?.toLowerCase() === UserRole.ADMIN.toLowerCase() ||
      session.role?.toLowerCase() === UserRole.SUPERADMIN.toLowerCase() ||
      session.isSuperAdmin)
  );
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await verifyAdminAccess(request);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const config = getBankRewardsConfig();
    const collector = new BankRewardsCollector(config);

    try {
      const result = await collector.collect();

      // Add stats to response
      const db = new BankRewardsDatabase();
      const offers = await db.getOffers();

      return NextResponse.json({
        success: true,
        data: {
          result,
          stats: {
            total: offers.length,
            active: offers.length,
            expired: 0,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('browserType.launch')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Scraping is not available in this environment',
              details:
                'Please run the scraper in a development environment or set up a dedicated scraping service.',
              originalError: error instanceof Error ? error.message : String(error),
            },
          },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error running BankRewards scraper:', error);
    return NextResponse.json(
      {
        success: false,
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
    const hasAccess = await verifyAdminAccess(request);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

    // Calculate stats
    const now = Date.now();
    const newToday = offers.filter((offer) => {
      const offerDate = new Date(offer.metadata.lastChecked).getTime();
      return now - offerDate < 24 * 60 * 60 * 1000;
    }).length;

    return NextResponse.json({
      status: 'running', // or 'idle' based on actual scraper status
      progress: 0, // Update with actual progress if available
      stats: {
        totalOffers: offers.length,
        newToday,
        successRate: 100, // Update with actual success rate
        avgTime: 0, // Update with actual average time
      },
      offers: transformedOffers.slice(0, 10), // Return first 10 offers for preview
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
