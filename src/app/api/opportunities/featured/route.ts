import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

interface Opportunity {
  id: string;
  type: 'credit_card' | 'bank' | 'brokerage';
  // Add other properties as needed
}

export async function GET() {
  try {
    console.log('📥 GET /api/opportunities/featured - Starting request');

    const db = getAdminDb();
    if (!db) {
      console.error('❌ Failed to initialize Firebase Admin');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const collectionRef = db.collection('opportunities');
    const queryRef = collectionRef
      .where('status', '==', 'approved')
      .where('metadata.featured', '==', true);

    const snapshot = await queryRef.get();

    console.log('📊 Featured opportunities snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
    });

    if (snapshot.empty) {
      console.log('ℹ️ No featured opportunities found');
      return NextResponse.json({
        items: [],
      });
    }

    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[];

    // Group by type and get one random opportunity per type
    const categories = ['credit_card', 'bank', 'brokerage'] as const;
    const featuredByType = categories
      .map((category) => {
        const categoryOpps = opportunities.filter((opp) => opp.type === category);
        if (categoryOpps.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * categoryOpps.length);
        return categoryOpps[randomIndex];
      })
      .filter(Boolean);

    return NextResponse.json({
      items: featuredByType,
    });
  } catch (error) {
    console.error('❌ Error fetching featured opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured opportunities' },
      { status: 500 }
    );
  }
}
