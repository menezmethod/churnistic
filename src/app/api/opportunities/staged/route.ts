import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('staged_offers').get();

    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
