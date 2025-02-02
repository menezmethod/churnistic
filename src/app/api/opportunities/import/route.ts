import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import type { FirestoreOpportunity } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const isPreviewEnvironment = process.env.VERCEL_ENV === 'preview';
const isProductionEnvironment = process.env.VERCEL_ENV === 'production';

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

    // Filter out duplicates
    const newOffers = offers.filter(
      (offer: FirestoreOpportunity) => !existingSourceIds.has(offer.source_id)
    );
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
