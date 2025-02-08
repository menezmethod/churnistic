import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { session } = await createAuthContext(request);
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get id from URL
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID', details: 'No ID provided in URL' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const batch = db.batch();

    // Get the opportunity from either staged or approved collection
    const stagedRef = db.collection('staged_offers').doc(id);
    const approvedRef = db.collection('opportunities').doc(id);
    const rejectedRef = db.collection('rejected_offers').doc(id);

    const [stagedDoc, approvedDoc] = await Promise.all([
      stagedRef.get(),
      approvedRef.get(),
    ]);

    let opportunityData;
    if (stagedDoc.exists) {
      opportunityData = stagedDoc.data();
      batch.delete(stagedRef);
    } else if (approvedDoc.exists) {
      opportunityData = approvedDoc.data();
      batch.delete(approvedRef);
    } else {
      return NextResponse.json(
        { error: 'Not Found', details: 'Opportunity not found' },
        { status: 404 }
      );
    }

    if (!opportunityData) {
      return NextResponse.json(
        { error: 'Invalid Data', details: 'Opportunity data is empty' },
        { status: 400 }
      );
    }

    // Add to rejected collection with metadata
    batch.set(rejectedRef, {
      ...opportunityData,
      status: 'rejected',
      metadata: {
        ...opportunityData.metadata,
        updated: new Date().toISOString(),
        updated_by: session.email,
        status: 'rejected',
      },
    });

    await batch.commit();

    return NextResponse.json({
      message: 'Successfully rejected opportunity',
      id,
    });
  } catch (error) {
    console.error('Error rejecting opportunity:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
