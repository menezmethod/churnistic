import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FirestoreOpportunity } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb();
    const { id } = params;

    // Get the document using admin SDK
    const doc = await db.collection('opportunities').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const data = doc.data() as Omit<FirestoreOpportunity, 'id'>;
    const opportunity = {
      id: doc.id,
      ...data,
      value: data.value || 0,
      bonus: {
        ...data.bonus,
        requirements: {
          ...data.bonus?.requirements,
          minimum_deposit: data.bonus?.requirements?.minimum_deposit || null,
          trading_requirements: data.bonus?.requirements?.trading_requirements || null,
          holding_period: data.bonus?.requirements?.holding_period || null,
        },
        tiers: data.bonus?.tiers || null,
      },
      details: {
        ...data.details,
        availability: data.details?.availability || { type: 'Nationwide' },
      },
    };

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get the opportunity to check permissions
      const db = getAdminDb();
      const doc = await db.collection('opportunities').doc(params.id).get();

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

    const body = await request.json();
    const { id } = params;

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update the opportunity
    const db = getAdminDb();
    const updateData = {
      ...body,
      // Ensure card_image is properly handled for credit cards
      card_image:
        body.type === 'credit_card'
          ? {
              url: body.card_image?.url || '',
              network: body.card_image?.network || 'Unknown',
              color: body.card_image?.color || 'Unknown',
              badge: body.card_image?.badge,
            }
          : undefined,
      metadata: {
        ...body.metadata,
        updated_at: new Date().toISOString(),
      },
    };

    await db.collection('opportunities').doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Opportunity updated successfully',
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get the opportunity to check permissions
      const db = getAdminDb();
      const doc = await db.collection('opportunities').doc(params.id).get();

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

    const db = getAdminDb();
    const { id } = params;

    // Delete the document using admin SDK
    await db.collection('opportunities').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
