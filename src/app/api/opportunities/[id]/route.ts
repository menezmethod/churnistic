import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FirestoreOpportunity } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    // Get the document using admin SDK
    const doc = await db.collection('opportunities').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      id: doc.id,
      ...data,
      metadata: {
        created_at: data?.metadata?.created_at || new Date().toISOString(),
        updated_at: data?.metadata?.updated_at || new Date().toISOString(),
        created_by: data?.metadata?.created_by || '',
        status: data?.metadata?.status || 'active',
        featured: Boolean(data?.metadata?.featured),
      },
    });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
  }
  try {
    const { session } = await createAuthContext(request);

    // Skip auth check in emulator mode
    if (!useEmulator) {
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get the opportunity to check permissions
      const db = getAdminDb();
      const doc = await db.collection('opportunities').doc(id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      const data = doc.data() as FirestoreOpportunity;
      const isAdmin = session.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const isCreator = session.email === data.metadata?.created_by;

      if (!isAdmin && !isCreator) {
        return NextResponse.json(
          { error: 'Not authorized to edit this opportunity' },
          { status: 403 }
        );
      }
    }

    // Check for special actions in query params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reject') {
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
        opportunityData = stagedDoc.data() as FirestoreOpportunity;
        batch.delete(stagedRef);
      } else if (approvedDoc.exists) {
        opportunityData = approvedDoc.data() as FirestoreOpportunity;
        batch.delete(approvedRef);
      } else {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      // Add to rejected collection with metadata
      batch.set(rejectedRef, {
        ...opportunityData,
        status: 'rejected',
        metadata: {
          ...opportunityData.metadata,
          updated: new Date().toISOString(),
          updated_by: session?.email || '',
          status: 'rejected',
        },
      });

      await batch.commit();

      return NextResponse.json({ success: true });
    }

    if (action === 'mark-for-review') {
      const { reason } = await request.json();
      const db = getAdminDb();
      await db
        .collection('opportunities')
        .doc(id)
        .update({
          'processing_status.needs_review': true,
          'processing_status.review_reason': reason,
          updatedAt: new Date().toISOString(),
          metadata: {
            updated_by: session?.email || '',
            updated_at: new Date().toISOString(),
          },
        });

      return NextResponse.json({ success: true });
    }

    // Regular update logic continues here...
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // For updates, only require that body is an object
    if (typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    // Ensure body contains at least one valid field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update the opportunity
    const db = getAdminDb();
    const firestoreUpdateData = Object.entries(body).reduce(
      (acc, [key, value]) => {
        if (key.startsWith('details.')) {
          acc[key] = value;
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    const updatedDoc = await db.collection('opportunities').doc(id);
    await updatedDoc.update(firestoreUpdateData);

    // Get the fresh data after update
    const freshDoc = await updatedDoc.get();
    if (!freshDoc.exists) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({
      id: freshDoc.id,
      ...freshDoc.data(),
      metadata: {
        ...freshDoc.data()?.metadata,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to update opportunity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get the opportunity to check permissions
      const db = getAdminDb();
      const doc = await db.collection('opportunities').doc(id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      const data = doc.data() as FirestoreOpportunity;
      const isAdmin = session.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const isCreator = session.email === data.metadata?.created_by;

      if (!isAdmin && !isCreator) {
        return NextResponse.json(
          { error: 'Not authorized to delete this opportunity' },
          { status: 403 }
        );
      }
    }

    // Delete the opportunity
    const db = getAdminDb();
    await db.collection('opportunities').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete opportunity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
