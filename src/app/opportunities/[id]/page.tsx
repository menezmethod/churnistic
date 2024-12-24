import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import OpportunityDetails from './OpportunityDetails';

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
  expirationDate: string | null;
  confidence: number;
  status: string;
}

async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const res = await fetch('http://localhost:8000/opportunities/recent', {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const opportunities = await res.json();
    return opportunities.find((opp: Opportunity) => opp.id === id) || null;
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityPage({ params }: PageProps) {
  const resolvedParams = await params;
  const opportunity = await getOpportunity(resolvedParams.id);

  if (!opportunity) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunityDetails opportunity={opportunity} />
    </Suspense>
  );
}
