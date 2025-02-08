import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

interface ReviewReason {
  code: string;
  message: string;
  timestamp: string;
}

interface ProcessingStatus {
  source_validation?: boolean;
  ai_processed?: boolean;
  duplicate_checked?: boolean;
  needs_review: boolean;
  review_reasons?: ReviewReason[];
  last_reviewed?: string;
  reviewed_by?: string;
}

interface Metadata {
  created: string;
  updated: string;
  status: string;
  created_by?: string;
  updated_by?: string;
}

interface Details {
  expiration?: string;
  monthly_fees?: {
    amount: string;
    waiver_details?: string;
  };
  account_type?: string;
  availability?: {
    type: string;
    states?: string[];
  };
  early_closure_fee?: string;
  [key: string]: string | number | boolean | object | undefined;
}

interface Opportunity {
  id: string;
  name: string;
  type: string;
  status: string;
  value?: number;
  metadata: Metadata;
  details: Details;
  processing_status: ProcessingStatus;
  [key: string]: string | number | boolean | object | undefined;
}

interface BulkApproveResponse {
  message: string;
  approvedCount: number;
  needsReviewCount: number;
  processedCount: number;
  skippedOffers?: Array<{
    id: string;
    name: string;
    reasons?: ReviewReason[];
  }>;
}

// Helper function to create a review reason
function createReviewReason(code: string, message: string): ReviewReason {
  return {
    code,
    message,
    timestamp: new Date().toISOString(),
  };
}

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

    // Now session.email is guaranteed to be string
    const userEmail = session.email;

    // Parse request body to check for force mode
    const body = await request.json();
    const force = body.force === true;
    console.log('Force mode enabled:', force);

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
      console.log('Total staged offers found:', stagedSnapshot.size);

      if (stagedSnapshot.empty) {
        return NextResponse.json<BulkApproveResponse>({
          message: 'No staged offers found to approve',
          approvedCount: 0,
          needsReviewCount: 0,
          processedCount: 0,
        });
      }

      // Separate offers into categories
      const { eligibleOffers, needsReviewOffers } = stagedSnapshot.docs.reduce<{
        eligibleOffers: Opportunity[];
        needsReviewOffers: Opportunity[];
      }>(
        (acc, doc) => {
          const data = doc.data() as Opportunity;
          const offer = { ...data, id: doc.id };
          const reviewReasons: ReviewReason[] = [];

          // Initialize processing_status if it doesn't exist
          offer.processing_status = offer.processing_status || {
            needs_review: false,
          };

          // 1. Check expiration
          const expiryDate = offer.details?.expiration;
          if (expiryDate && expiryDate !== 'None Listed') {
            try {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const expiry = new Date(expiryDate);
              expiry.setHours(0, 0, 0, 0);

              const diffDays = Math.ceil(
                (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (diffDays < 0) {
                reviewReasons.push(createReviewReason('EXPIRED', 'Offer has expired'));
              }
            } catch {
              reviewReasons.push(
                createReviewReason('INVALID_DATE', 'Invalid expiration date format')
              );
            }
          }

          // 2. Check value thresholds
          if (offer.value && offer.value > 1000) {
            reviewReasons.push(
              createReviewReason('HIGH_VALUE', 'High value offer needs verification')
            );
          }

          // 3. Check existing review status
          if (offer.processing_status.review_reasons?.length) {
            reviewReasons.push(...offer.processing_status.review_reasons);
          }

          // Update the processing status
          if (reviewReasons.length > 0) {
            offer.processing_status = {
              ...offer.processing_status,
              needs_review: true,
              review_reasons: reviewReasons,
              last_reviewed: new Date().toISOString(),
              reviewed_by: userEmail,
            };
            acc.needsReviewOffers.push(offer);
          } else {
            offer.processing_status = {
              ...offer.processing_status,
              needs_review: false,
              review_reasons: [],
              last_reviewed: new Date().toISOString(),
              reviewed_by: userEmail,
            };
            acc.eligibleOffers.push(offer);
          }

          console.log(`Checking offer ${offer.name}:`, {
            expiryDate,
            needsReview: reviewReasons.length > 0,
            reasons: reviewReasons,
            processingStatus: offer.processing_status,
          });

          return acc;
        },
        { eligibleOffers: [], needsReviewOffers: [] }
      );

      console.log(
        `Found ${eligibleOffers.length} eligible offers and ${needsReviewOffers.length} offers needing review`
      );

      // If not in force mode and no eligible offers, return early
      if (!force && eligibleOffers.length === 0) {
        return NextResponse.json<BulkApproveResponse>({
          message: 'No eligible offers found to approve (all need review)',
          approvedCount: 0,
          needsReviewCount: needsReviewOffers.length,
          processedCount: 0,
          skippedOffers: needsReviewOffers.map((offer) => ({
            id: offer.id,
            name: offer.name,
            reasons: offer.processing_status.review_reasons,
          })),
        });
      }

      // Determine which offers to process
      const offersToProcess = force
        ? [...eligibleOffers, ...needsReviewOffers]
        : eligibleOffers;
      console.log(`Processing ${offersToProcess.length} offers (force mode: ${force})`);

      let processed = 0;
      const batches = [];

      // Process in batches
      for (let i = 0; i < offersToProcess.length; i += batchSize) {
        const batch = db.batch();
        const batchOffers = offersToProcess.slice(i, i + batchSize);

        batchOffers.forEach((offer) => {
          const opportunityRef = opportunitiesRef.doc(offer.id);
          const stagedRef = stagedOffersRef.doc(offer.id);

          // Set the approved opportunity
          batch.set(opportunityRef, {
            ...offer,
            status: 'approved',
            metadata: {
              ...offer.metadata,
              updated: new Date().toISOString(),
              updated_by: userEmail,
              status: 'active',
            },
            processing_status: {
              ...offer.processing_status,
              needs_review: false,
              review_reasons: [],
              last_reviewed: new Date().toISOString(),
              reviewed_by: userEmail,
            },
          });

          // Delete from staged
          batch.delete(stagedRef);
        });

        batches.push(batch.commit());
        processed += batchOffers.length;
      }

      // Wait for all batches to complete
      await Promise.all(batches);

      const response: BulkApproveResponse = {
        message: `Successfully approved ${processed} ${force ? 'offers (force mode)' : 'eligible offers'}`,
        approvedCount: processed,
        needsReviewCount: needsReviewOffers.length,
        processedCount: processed,
      };

      // Only include skipped offers if there are any and we're not in force mode
      if (!force && needsReviewOffers.length > 0) {
        response.skippedOffers = needsReviewOffers.map((offer) => ({
          id: offer.id,
          name: offer.name,
          reasons: offer.processing_status.review_reasons,
        }));
      }

      return NextResponse.json(response);
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
