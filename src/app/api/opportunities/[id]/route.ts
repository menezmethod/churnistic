import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/opportunities/[id] - Starting request');

    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(req);
      console.log('Auth session:', session);
      if (!session?.email) {
        console.log('No session email found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = params;
    console.log('Fetching opportunity:', id);

    const db = getAdminDb();
    const docRef = db.collection('opportunities').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log('Opportunity not found:', id);
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opportunity = {
      id: docSnap.id,
      ...docSnap.data(),
    };

    console.log('Found opportunity:', opportunity);
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity', details: errorMessage },
      { status: 500 }
    );
  }
}
