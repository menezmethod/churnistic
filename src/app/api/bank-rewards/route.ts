import { collection, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase/config';

export async function GET() {
  try {
    const opportunitiesRef = collection(db, 'opportunities');
    const snapshot = await getDocs(opportunitiesRef);

    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        source?: { name?: string };
        details?: { expiration?: string };
      }),
    }));

    // Filter only bank rewards opportunities
    const bankRewardsOffers = opportunities.filter(
      (opp) => opp.source?.name === 'bankrewards'
    );

    // Calculate stats
    const stats = {
      total: bankRewardsOffers.length,
      active: bankRewardsOffers.filter(
        (opp) => !opp.details?.expiration || new Date(opp.details.expiration) > new Date()
      ).length,
      expired: bankRewardsOffers.filter(
        (opp) => opp.details?.expiration && new Date(opp.details.expiration) <= new Date()
      ).length,
    };

    return NextResponse.json({
      data: {
        stats,
        offers: bankRewardsOffers,
      },
    });
  } catch (error) {
    console.error('Error fetching bank rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank rewards data' },
      { status: 500 }
    );
  }
}
