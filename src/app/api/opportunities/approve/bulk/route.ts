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

    // Parse request body to check for force mode
    const { force = false } = await request.json();

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

      // If not in force mode, filter out offers that need review
      if (!force) {
        const filteredDocs = stagedSnapshot.docs.filter(
          (doc) => !doc.data().processing_status?.needs_review
        );

        if (filteredDocs.length === 0) {
          return NextResponse.json({
            message: 'No eligible offers found to approve (all need review)',
            approvedCount: 0,
          });
        }

        // Process in batches of 500 (Firestore limit)
        let processed = 0;

        while (processed < filteredDocs.length) {
          const batch = db.batch();
          const batchDocs = filteredDocs.slice(processed, processed + batchSize);

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
          message: `Successfully approved ${filteredDocs.length} ${force ? 'offers (force mode)' : 'eligible offers'}`,
          approvedCount: filteredDocs.length,
        });
      }
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
