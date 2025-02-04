import { initializeApp, getApps } from 'firebase-admin/app';
import { applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Proper singleton initialization
if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(), // Ensure service account credentials
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const firestore = getFirestore();

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    // Replace document fetching with count queries
    const [approvedCount, stagedCount] = await Promise.all([
      firestore
        .collection('opportunities')
        .where('status', '==', 'approved')
        .count()
        .get(),
      firestore.collection('staged_offers').count().get(),
    ]);

    const totalApproved = approvedCount.data().count;
    const totalStaged = stagedCount.data().count;

    // Calculate core metrics
    const total = totalApproved + totalStaged;

    // Calculate average value and high value offers
    const approvedValues = await firestore
      .collection('opportunities')
      .where('status', '==', 'approved')
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => {
          const value = parseFloat(doc.data().value) || 0;
          return { value, type: doc.data().type };
        })
      );

    const avgValue =
      approvedValues.length > 0
        ? approvedValues.reduce((a, b) => a + b.value, 0) / approvedValues.length
        : 0;

    // Calculate type counts and high value offers
    const byType = { bank: 0, credit_card: 0, brokerage: 0 };
    let highValue = 0;

    approvedValues.forEach(({ value, type }) => {
      if (value >= 500) highValue++;
      if (type === 'bank') byType.bank++;
      if (type === 'credit_card') byType.credit_card++;
      if (type === 'brokerage') byType.brokerage++;
    });

    // Use Next.js native cache headers
    const result = {
      total,
      pending: totalStaged,
      approved: totalApproved,
      avgValue: Math.round(avgValue),
      byType,
      highValue,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
