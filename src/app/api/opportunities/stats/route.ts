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

const firestore = getFirestore();

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      // Only fetch from opportunities collection
      const opportunitiesSnapshot = await firestore.collection('opportunities').get();

      const total = opportunitiesSnapshot.size;
      const byType = { bank: 0, credit_card: 0, brokerage: 0 };
      let totalValue = 0;
      let highValue = 0;
      let approvedCount = 0;
      let pendingCount = 0;

      opportunitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        const value = parseFloat(data.value) || 0;
        const status = data.status;

        // Count by status
        if (status === 'approved') approvedCount++;
        if (status === 'pending') pendingCount++;

        // Calculate totals
        totalValue += value;
        if (value >= 500) highValue++;
        if (data.type === 'bank') byType.bank++;
        if (data.type === 'credit_card') byType.credit_card++;
        if (data.type === 'brokerage') byType.brokerage++;
      });

      // Calculate average value
      const avgValue = total > 0 ? Math.round(totalValue / total) : 0;

      const result = {
        // Basic stats for splash page
        activeCount: approvedCount,
        totalPotentialValue: totalValue,
        averageValue: avgValue,

        // Detailed stats for admin
        total,
        pending: pendingCount,
        approved: approvedCount,
        avgValue,
        byType,
        highValue,

        // Metadata
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
    console.error('Stats endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
