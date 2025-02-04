import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using createAuthContext
    const { session } = await createAuthContext(request);
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User not authenticated' },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const stagedOffersRef = db.collection('staged_offers');
    const opportunitiesRef = db.collection('opportunities');

    // Get all staged offers
    const stagedSnapshot = await stagedOffersRef.get();

    if (stagedSnapshot.empty) {
      return NextResponse.json({
        message: 'No staged offers found to approve',
        approvedCount: 0,
      });
    }

    // Start a batch operation
    const batch = db.batch();
    const now = new Date().toISOString();

    // Process each staged offer
    stagedSnapshot.forEach((doc) => {
      const data = doc.data();

      // Add to opportunities collection with approved status
      const opportunityRef = opportunitiesRef.doc(doc.id);
      batch.set(opportunityRef, {
        ...data,
        status: 'approved',
        metadata: {
          ...data.metadata,
          updated_at: now,
          updated_by: session.email,
          status: 'active',
        },
        processing_status: {
          ...data.processing_status,
          needs_review: false,
        },
      });

      // Delete from staged_offers
      batch.delete(stagedOffersRef.doc(doc.id));
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      message: 'Successfully approved all staged offers',
      approvedCount: stagedSnapshot.size,
    });
  } catch (error) {
    console.error('Error in bulk approve:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
