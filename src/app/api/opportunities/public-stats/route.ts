import { initializeApp, getApps } from 'firebase-admin/app';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Proper singleton initialization
if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const db = getFirestore();
      const opportunitiesSnapshot = await db
        .collection('opportunities')
        .where('status', '==', 'approved')
        .get();

      // Initialize counters
      let activeCount = 0;
      let totalValue = 0;

      // Process opportunities collection
      opportunitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        const value = parseFloat(data.value) || 0;
        totalValue += value;
        activeCount++;
      });

      const averageValue = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;

      const result = {
        activeCount,
        totalPotentialValue: totalValue,
        averageValue,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Stats request timed out' }, { status: 504 });
    }
    console.error('Public stats endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
