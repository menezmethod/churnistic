import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { type Opportunity } from '@/types/opportunity';

export async function GET() {
  try {
    console.log('GET /api/opportunities/staged - Starting request');
    const db = getAdminDb();
    const snapshot = await db.collection('staged_offers').get();

    console.log('Staged offers snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
    });

    const opportunities = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Opportunity
    );

    console.log('Processed opportunities:', {
      count: opportunities.length,
      sample: opportunities[0]
        ? {
            id: opportunities[0].id,
            name: opportunities[0].name,
            type: opportunities[0].type,
          }
        : null,
    });

    return NextResponse.json({
      success: true,
      opportunities,
    });
  } catch (error) {
    console.error('Error fetching staged opportunities:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch staged opportunities',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
