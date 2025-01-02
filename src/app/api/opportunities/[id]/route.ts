import { NextRequest, NextResponse } from 'next/server';

import { ChurningOpportunity } from '@/types/churning';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await fetch('http://localhost:8000/opportunities/recent');
    if (!res.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const opportunities = await res.json();
    const opportunity = opportunities.find((opp: ChurningOpportunity) => opp.id === id);

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch opportunity';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
