import React from 'react';
import { Suspense } from 'react';

interface Opportunity {
  id: string;
  title: string;
  value: string;
  type: string;
  bank?: string;
  description?: string;
  requirements?: string[];
  source?: string;
  sourceLink?: string;
  postedDate?: string;
  confidence?: number;
  status?: string;
}

async function getOpportunity() {
  const res = await fetch('http://localhost:8000/opportunities/recent', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch opportunities');
  }

  const opportunities = await res.json();
  return opportunities.find((opp: Opportunity) => opp.id === '1h1spck_1');
}

export default async function TestPage() {
  const opportunity = await getOpportunity();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div style={{ padding: '2rem' }}>
        <h1>Test Opportunity Page</h1>
        <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
          {JSON.stringify(opportunity, null, 2)}
        </pre>
      </div>
    </Suspense>
  );
}
