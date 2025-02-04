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
      // Fetch only approved opportunities in a single query
      const approvedSnapshot = await firestore
        .collection('opportunities')
        .where('status', '==', 'approved')
        .get();

      // Fetch staged offers count separately (usually smaller)
      const stagedSnapshot = await firestore.collection('staged_offers').get();

      const totalApproved = approvedSnapshot.size;
      const totalStaged = stagedSnapshot.size;
      const total = totalApproved + totalStaged;

      // Process approved opportunities
      const byType = { bank: 0, credit_card: 0, brokerage: 0 };
      let totalValue = 0;
      let highValue = 0;

      approvedSnapshot.forEach((doc) => {
        const data = doc.data();
        const value = parseFloat(data.value) || 0;
        totalValue += value;

        if (value >= 500) highValue++;
        if (data.type === 'bank') byType.bank++;
        if (data.type === 'credit_card') byType.credit_card++;
        if (data.type === 'brokerage') byType.brokerage++;
      });

      // Calculate average value
      const avgValue = totalApproved > 0 ? Math.round(totalValue / totalApproved) : 0;

      const result = {
        total,
        pending: totalStaged,
        approved: totalApproved,
        avgValue,
        byType,
        highValue,
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
