import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

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

    // Always require authentication in production
    if (isProductionEnvironment || (!useEmulator && !isPreviewEnvironment)) {
      const { session } = await createAuthContext(request);
      console.log('Auth check result:', {
        hasSession: !!session,
        email: session?.email,
        isAdmin: session?.isAdmin,
      });

      if (!session?.email || !session?.isAdmin) {
        return NextResponse.json(
          {
            error: 'Unauthorized. Admin access required.',
            auth: {
              hasSession: !!session,
              email: session?.email,
              isAdmin: session?.isAdmin,
            },
          },
          { status: 401 }
        );
      }
    }

    const { offers } = await request.json();
    if (!Array.isArray(offers)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of offers.' },
        { status: 400 }
      );
    }

    console.log(`Processing ${offers.length} offers`);

    const db = getAdminDb();
    const batch = db.batch();

    // Only check against approved opportunities for duplicates
    const approvedSnapshot = await db
      .collection('opportunities')
      .where('status', '==', 'approved')
      .get();

    // Track approved offers by source_id
    const approvedSourceIds = new Set(
      approvedSnapshot.docs.map((doc) => doc.data().source_id)
    );

    console.log(`Found ${approvedSourceIds.size} existing approved offers`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const offer of offers) {
      // Skip if already approved (but not if just staged)
      if (approvedSourceIds.has(offer.source_id)) {
        console.log(`Skipping offer ${offer.source_id} - already approved`);
        skippedCount++;
        continue;
      }

      // Use source_id as document ID to prevent duplicates
      const docRef = db.collection('staged_offers').doc(offer.source_id);
      batch.set(docRef, {
        ...offer,
        metadata: {
          ...offer.metadata,
          imported_at: new Date().toISOString(),
          environment: process.env.VERCEL_ENV || 'development',
          created_by: request.headers.get('x-user-email') || 'system',
        },
      });
      addedCount++;
    }

    if (addedCount > 0) {
      console.log(`Committing batch with ${addedCount} new offers`);
      await batch.commit();
      console.log('Batch commit successful');
    } else {
      console.log('No new offers to commit');
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
      total: offers.length,
      environment: {
        useEmulator,
        vercelEnv: process.env.VERCEL_ENV,
        isPreviewEnvironment,
        isProductionEnvironment,
      },
    });
  } catch (error) {
    console.error('Error importing opportunities:', error);
    return NextResponse.json(
      {
        error: 'Failed to import opportunities',
        details: error instanceof Error ? error.message : String(error),
        environment: {
          useEmulator,
          vercelEnv: process.env.VERCEL_ENV,
          isPreviewEnvironment,
          isProductionEnvironment,
        },
      },
      { status: 500 }
    );
  }
}
