import { NextResponse } from 'next/server';

interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: string | number;
  bank: string;
  description: string;
  requirements: string[];
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const res = await fetch('http://localhost:8000/opportunities/recent');
    if (!res.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const opportunities = await res.json();
    const opportunity = opportunities.find((opp: Opportunity) => opp.id === params.id);

    if (!opportunity) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
