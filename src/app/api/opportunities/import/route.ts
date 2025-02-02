import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const isPreviewEnvironment = process.env.VERCEL_ENV === 'preview';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/opportunities/import - Starting request');

    // Skip auth check in emulator or preview environment
    if (!useEmulator && !isPreviewEnvironment) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { offers } = await request.json();
    if (!Array.isArray(offers)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of offers.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const batch = db.batch();

    // Get existing staged offers and opportunities to check for duplicates
    const [stagedSnapshot, approvedSnapshot] = await Promise.all([
      db.collection('staged_offers').get(),
      db.collection('opportunities').get(),
    ]);

    // Track both staged and approved offers by source_id
    const existingSourceIds = new Set([
      ...stagedSnapshot.docs.map((doc) => doc.data().source_id),
      ...approvedSnapshot.docs.map((doc) => doc.data().source_id),
    ]);

    let addedCount = 0;
    let skippedCount = 0;

    for (const offer of offers) {
      // Skip if already staged or previously approved
      if (existingSourceIds.has(offer.source_id)) {
        skippedCount++;
        continue;
      }

      // Use source_id as document ID to prevent duplicates
      const docRef = db.collection('staged_offers').doc(offer.source_id);
      batch.set(docRef, offer);
      addedCount++;
    }

    if (addedCount > 0) {
      await batch.commit();
      console.log('Batch commit successful');
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
      total: offers.length,
    });
  } catch (error) {
    console.error('Error importing opportunities:', error);
    return NextResponse.json(
      {
        error: 'Failed to import opportunities',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
