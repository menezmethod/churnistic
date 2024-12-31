import { NextResponse } from 'next/server';

import { BankRewardsScraper } from '@/lib/scrapers/bankrewards';

import { getBankRewardsConfig } from './config';

export async function POST(request: Request) {
  try {
    const config = getBankRewardsConfig();
    const scraper = new BankRewardsScraper(config);

    const result = await scraper.run();

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

// Only allow POST requests
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}

export const dynamic = 'force-dynamic';
