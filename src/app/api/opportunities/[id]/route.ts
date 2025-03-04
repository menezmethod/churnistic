import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FirestoreOpportunity } from '@/types/opportunity';
import { processNestedUpdates, prepareUpdateData } from '@/utils/objectUtils';

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
  
  console.log(`PUT request received for opportunity ${id}`);
  
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
      console.log(`Request body for opportunity ${id}:`, body);
    } catch (e) {
      console.error(`Invalid JSON in request for opportunity ${id}:`, e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      console.error(`Invalid request body type for opportunity ${id}:`, body);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // For updates, only require that body is an object
    if (typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    // Ensure body contains at least one valid field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Process update data using our utility function to handle nested fields properly
    const db = getAdminDb();
    
    // First, get the current document to properly merge with existing data
    const currentDoc = await db.collection('opportunities').doc(id).get();
    
    if (!currentDoc.exists) {
      console.error(`Opportunity ${id} not found during update`);
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }
    
    const currentData = currentDoc.data() as FirestoreOpportunity;
    console.log(`Current data for opportunity ${id} before update:`, currentData);
    
    // Use our improved update data preparation that preserves nested objects
    // It will first create a properly merged document, then process it for Firestore
    const mergedData = prepareUpdateData(currentData, body);
    const firestoreUpdateData = processNestedUpdates(mergedData);

    // Debug logging
    console.log(`Received update data for opportunity ${id}:`, body);
    console.log(`Merged update data for opportunity ${id}:`, mergedData);
    console.log(`Processed update data for Firestore for opportunity ${id}:`, firestoreUpdateData);

    // Compare keys to verify no data loss
    if (currentData.details && mergedData.details) {
      console.log('Details object key comparison:', {
        currentDetailsKeys: Object.keys(currentData.details),
        mergedDetailsKeys: Object.keys(mergedData.details as Record<string, unknown>),
        missingKeys: Object.keys(currentData.details).filter(
          key => !(mergedData.details as Record<string, unknown>)[key]
        )
      });
    }

    // Update the document
    const updatedDoc = db.collection('opportunities').doc(id);
    await updatedDoc.update(firestoreUpdateData);
    console.log(`Successfully updated opportunity ${id} in Firestore`);

    // Get the fresh data after update
    const freshDoc = await updatedDoc.get();
    if (!freshDoc.exists) {
      console.error(`Could not retrieve updated opportunity ${id}`);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Ensure all the data is preserved by deep merging with the original
    const freshData = freshDoc.data() as FirestoreOpportunity;
    console.log(`Raw data after Firestore update for ${id}:`, freshData);
    
    // Verify that all expected fields are still present
    if (currentData.details && freshData.details) {
      const missingKeys = Object.keys(currentData.details).filter(
        key => !Object.keys(freshData.details).includes(key)
      );
      
      if (missingKeys.length > 0) {
        console.warn(`Missing keys in details object after update for ${id}:`, missingKeys);
      }
    }
    
    const responseData = {
      id: freshDoc.id,
      ...freshData,
      metadata: {
        ...freshData.metadata,
        updated_at: new Date().toISOString(),
      },
    };
    
    console.log(`Response data for opportunity ${id} update:`, responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error updating opportunity ${id}:`, error);
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
