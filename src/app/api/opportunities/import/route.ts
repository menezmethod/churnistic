import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import type { FirestoreOpportunity } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const isPreviewEnvironment = process.env.VERCEL_ENV === 'preview';
const isProductionEnvironment = process.env.VERCEL_ENV === 'production';

// Add helper function for similarity checking
function calculateSimilarity(
  offer1: FirestoreOpportunity,
  offer2: FirestoreOpportunity
): number {
  let score = 0;

  // Check name similarity (case insensitive)
  if (offer1.name.toLowerCase() === offer2.name.toLowerCase()) {
    score += 0.4;
  }

  // Check value similarity (within 10% range)
  const valueDiff = Math.abs(offer1.value - offer2.value);
  if (valueDiff <= offer1.value * 0.1) {
    score += 0.3;
  }

  // Check requirements similarity
  const reqs1 = offer1.bonus?.requirements || [];
  const reqs2 = offer2.bonus?.requirements || [];

  if (reqs1.length > 0 && reqs2.length > 0) {
    const matchingReqs = reqs1.filter((req1) =>
      reqs2.some(
        (req2) =>
          req1.type === req2.type &&
          Math.abs(req1.details.amount - req2.details.amount) <= req1.details.amount * 0.1
      )
    );
    if (reqs1.length > 0) {
      score += (matchingReqs.length / reqs1.length) * 0.3;
    }
  }

  return score;
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/opportunities/import - Starting request', {
      useEmulator,
      vercelEnv: process.env.VERCEL_ENV,
      isPreviewEnvironment,
      isProductionEnvironment,
    });

    // Verify authentication
    const { session } = await createAuthContext(request);
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Parse request body
    const { offers } = await request.json();
    if (!Array.isArray(offers)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Offers must be an array' },
        { status: 400 }
      );
    }

    console.log(`Processing ${offers.length} offers for import`);

    // Initialize admin DB
    const db = getAdminDb();

    // Get existing opportunities and staged offers for duplicate checking
    const [existingOppsSnapshot, stagedOppsSnapshot] = await Promise.all([
      db.collection('opportunities').get(),
      db.collection('staged_offers').get(),
    ]);

    const existingSourceIds = new Set([
      ...existingOppsSnapshot.docs.map((doc) => doc.data().source_id as string),
      ...stagedOppsSnapshot.docs.map((doc) => doc.data().source_id as string),
    ]);

    const existingOpportunities = [
      ...existingOppsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ...stagedOppsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ] as FirestoreOpportunity[];

    // Filter out duplicates and check for similar opportunities
    const newOffers = offers
      .map((offer: FirestoreOpportunity) => {
        // Check for exact source_id match
        if (existingSourceIds.has(offer.source_id)) {
          return null;
        }

        // Initialize processing_status and ai_insights if they don't exist
        if (!offer.processing_status) {
          offer.processing_status = {
            source_validation: true,
            ai_processed: false,
            duplicate_checked: false,
            needs_review: false,
          };
        }

        if (!offer.ai_insights) {
          offer.ai_insights = {
            confidence_score: 0.8,
            validation_warnings: [],
            potential_duplicates: [],
          };
        }

        // Check for similar opportunities
        const similarOpportunities = existingOpportunities
          .map((existing) => ({
            opportunity: existing,
            similarity: calculateSimilarity(offer, existing),
          }))
          .filter(({ similarity }) => similarity >= 0.7) // 70% similarity threshold
          .sort((a, b) => b.similarity - a.similarity);

        // Add potential duplicates to ai_insights
        if (similarOpportunities.length > 0) {
          offer.ai_insights.potential_duplicates = similarOpportunities.map(
            ({ opportunity, similarity }) => ({
              id: opportunity.id || '',
              name: opportunity.name,
              similarity: similarity,
            })
          );
          offer.processing_status.duplicate_checked = true;
          offer.processing_status.needs_review = true;
        }

        return offer;
      })
      .filter(Boolean) as FirestoreOpportunity[];

    console.log(`Found ${newOffers.length} new offers to import`);

    if (newOffers.length === 0) {
      return NextResponse.json({ addedCount: 0, message: 'No new offers to import' });
    }

    // Use batch write for atomic operation
    const batch = db.batch();
    const stagedOffersRef = db.collection('staged_offers');

    newOffers.forEach((offer: FirestoreOpportunity) => {
      const docRef = stagedOffersRef.doc();
      batch.set(docRef, {
        ...offer,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        metadata: {
          created_by: session.email,
          created_at: new Date().toISOString(),
          updated_by: session.email,
          updated_at: new Date().toISOString(),
          status: 'pending',
          environment: process.env.NODE_ENV || 'development',
        },
      });
    });

    await batch.commit();
    console.log(`Successfully imported ${newOffers.length} offers`);

    return NextResponse.json({
      addedCount: newOffers.length,
      message: `Successfully imported ${newOffers.length} offers`,
    });
  } catch (error: unknown) {
    console.error('Error importing opportunities:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
