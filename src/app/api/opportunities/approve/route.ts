import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { session } = await createAuthContext(request);
    if (!session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Parse request body
    const opportunity = await request.json();
    if (!opportunity?.id) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Initialize admin DB
    const db = getAdminDb();

    // Create approved opportunity
    const approvedOpportunity = {
      ...opportunity,
      status: 'approved',
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(opportunity.metadata || {}),
        created_by: session.email,
        updated_by: session.email,
        updated_at: new Date().toISOString(),
        status: 'active',
      },
    };

    // Use batch write for atomic operation
    const batch = db.batch();

    // Add to opportunities collection
    const opportunityRef = db.collection('opportunities').doc(opportunity.id);
    batch.set(opportunityRef, approvedOpportunity);

    // Remove from staged_offers collection if it exists
    const stagedRef = db.collection('staged_offers').doc(opportunity.id);
    batch.delete(stagedRef);

    // Commit the batch
    await batch.commit();

    // Also update the API endpoint if needed
    try {
      const apiResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/opportunities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.API_KEY}`,
          },
          body: JSON.stringify({
            ...approvedOpportunity,
            value: approvedOpportunity.value.toString(),
          }),
        }
      );

      if (!apiResponse.ok) {
        console.error('API Error:', await apiResponse.text());
        // Don't throw here, we still want to return success for the Firestore operation
      }
    } catch (apiError) {
      console.error('Error updating API:', apiError);
      // Don't throw here, we still want to return success for the Firestore operation
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity approved successfully',
      opportunity: approvedOpportunity,
    });
  } catch (error: unknown) {
    console.error('Error approving opportunity:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
