import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function POST(request: NextRequest) {
  try {
    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { collection } = await request.json();

    if (!collection || !['opportunities', 'staged_offers'].includes(collection)) {
      return NextResponse.json(
        { error: 'Invalid collection specified' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const collectionRef = adminDb.collection(collection);
    const snapshot = await collectionRef.get();
    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(collectionRef.doc(doc.id));
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: snapshot.size,
      message: `Successfully reset ${collection}`,
    });
  } catch (error) {
    console.error(`Error resetting collection:`, error);
    return NextResponse.json(
      {
        error: 'Failed to reset collection',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
