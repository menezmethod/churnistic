import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { Opportunity } from '@/types/opportunity';

export async function GET() {
  try {
    const db = getAdminDb();
    const [opportunitiesSnapshot, stagedSnapshot] = await Promise.all([
      db.collection('opportunities').get(),
      db.collection('staged_offers').get(),
    ]);

    const opportunities = opportunitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[];

    const stagedCount = stagedSnapshot.size;
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

    const stats = {
      total: opportunities.length + stagedCount,
      pending:
        opportunities.filter((opp) => opp.status === 'pending').length + stagedCount,
      approved: opportunities.filter((opp) => opp.status === 'approved').length,
      rejected: opportunities.filter((opp) => opp.status === 'rejected').length,
      avgValue:
        opportunities.length > 0 ? Math.round(totalValue / opportunities.length) : 0,
      highValue: opportunities.filter((opp) => opp.value >= 500).length,
      byType: {
        bank: opportunities.filter((opp) => opp.type === 'bank').length,
        credit_card: opportunities.filter((opp) => opp.type === 'credit_card').length,
        brokerage: opportunities.filter((opp) => opp.type === 'brokerage').length,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching opportunity stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch opportunity stats',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
