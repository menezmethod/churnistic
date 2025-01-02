import { type Query, type DocumentData } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/firebase/admin';

// Validation schemas
const opportunitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
  type: z.string(),
  value: z.number().positive(),
  probability: z.number().min(0).max(100).optional(),
  targetDate: z.string().optional(),
});

const updateOpportunitySchema = opportunitySchema.partial().extend({
  id: z.string(),
});

interface Opportunity {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  type: string;
  value: number;
  probability?: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';

    const opportunitiesRef = db.collection('opportunities');
    let query: Query<DocumentData> = opportunitiesRef;

    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    query = query.orderBy(sortField, sortDirection);

    const opportunitiesSnapshot = await query.get();
    const opportunities = opportunitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[];

    return NextResponse.json({
      data: opportunities,
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch opportunities',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = opportunitySchema.parse(body);

    // Check if opportunity with same name exists
    const existingOpportunitySnapshot = await db
      .collection('opportunities')
      .where('name', '==', validatedData.name)
      .get();

    if (!existingOpportunitySnapshot.empty) {
      return NextResponse.json(
        {
          error: {
            message: 'Opportunity with this name already exists',
            details: { field: 'name', value: validatedData.name },
          },
        },
        { status: 400 }
      );
    }

    const opportunityData: Omit<Opportunity, 'id'> = {
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('opportunities').add(opportunityData);
    const newOpportunitySnapshot = await docRef.get();
    const newOpportunity = {
      id: newOpportunitySnapshot.id,
      ...newOpportunitySnapshot.data(),
    } as Opportunity;

    return NextResponse.json({ data: newOpportunity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to create opportunity',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = updateOpportunitySchema.parse(body);

    const opportunityRef = db.collection('opportunities').doc(id);
    const opportunityDoc = await opportunityRef.get();

    if (!opportunityDoc.exists) {
      return NextResponse.json(
        {
          error: {
            message: 'Opportunity not found',
            details: { id },
          },
        },
        { status: 404 }
      );
    }

    await opportunityRef.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const updatedOpportunitySnapshot = await opportunityRef.get();
    const updatedOpportunity = {
      id: updatedOpportunitySnapshot.id,
      ...updatedOpportunitySnapshot.data(),
    } as Opportunity;

    return NextResponse.json({ data: updatedOpportunity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to update opportunity',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: 'Opportunity ID is required',
          },
        },
        { status: 400 }
      );
    }

    const opportunityRef = db.collection('opportunities').doc(id);
    const opportunityDoc = await opportunityRef.get();

    if (!opportunityDoc.exists) {
      return NextResponse.json(
        {
          error: {
            message: 'Opportunity not found',
            details: { id },
          },
        },
        { status: 404 }
      );
    }

    await opportunityRef.delete();

    return NextResponse.json({
      data: { success: true },
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to delete opportunity',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
