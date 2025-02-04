import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FirestoreOpportunity } from '@/types/opportunity';

export async function POST(request: NextRequest) {
  try {
    // Skip auth check in emulator mode
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'true') {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
    }

    const db = getAdminDb();

    // Get the opportunity from opportunities collection
    const opportunityDoc = await db.collection('opportunities').doc(body.id).get();
    if (!opportunityDoc.exists) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opportunityData = opportunityDoc.data() as FirestoreOpportunity;

    // Move to staged_offers collection
    await db
      .collection('staged_offers')
      .doc(body.id)
      .set({
        ...opportunityData,
        status: 'staged',
        metadata: {
          ...opportunityData.metadata,
          updated_at: new Date().toISOString(),
        },
      });

    // Delete from opportunities collection
    await db.collection('opportunities').doc(body.id).delete();

    return NextResponse.json({
      success: true,
      message: 'Opportunity moved to staged successfully',
    });
  } catch (error) {
    console.error('Error rejecting opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject opportunity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
