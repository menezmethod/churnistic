import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

const app = getApp();
const firestore = getFirestore(app);

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    // Get approved opportunities
    const approvedSnapshot = await firestore
      .collection('opportunities')
      .where('status', '==', 'approved')
      .get();

    // Get staged offers count
    const stagedSnapshot = await firestore.collection('staged_offers').count().get();

    // Calculate core metrics
    const totalApproved = approvedSnapshot.size;
    const totalStaged = stagedSnapshot.data().count;
    const total = totalApproved + totalStaged;

    // Calculate average value and high value offers
    const approvedValues = approvedSnapshot.docs.map((doc) => {
      const value = parseFloat(doc.data().value) || 0;
      return { value, type: doc.data().type };
    });

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

    return NextResponse.json({
      total,
      pending: totalStaged,
      approved: totalApproved,
      avgValue: Math.round(avgValue),
      byType,
      highValue,
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
