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

    // Add timeout protection
    const batchSize = 500;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9s timeout

    try {
      // Get all staged offers
      const stagedSnapshot = await stagedOffersRef.get();

      if (stagedSnapshot.empty) {
        return NextResponse.json({
          message: 'No staged offers found to approve',
          approvedCount: 0,
        });
      }

      // Process in batches of 500 (Firestore limit)
      let processed = 0;

      while (processed < stagedSnapshot.size) {
        const batch = db.batch();
        const batchDocs = stagedSnapshot.docs.slice(processed, processed + batchSize);

        batchDocs.forEach((doc) => {
          const data = doc.data();

          // Add to opportunities collection with approved status
          const opportunityRef = opportunitiesRef.doc(doc.id);
          batch.set(opportunityRef, {
            ...data,
            status: 'approved',
            metadata: {
              ...data.metadata,
              updated_at: new Date().toISOString(),
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

        await batch.commit();
        processed += batchSize;
      }

      return NextResponse.json({
        message: 'Successfully approved all staged offers',
        approvedCount: stagedSnapshot.size,
      });
    } finally {
      clearTimeout(timeout);
    }
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
