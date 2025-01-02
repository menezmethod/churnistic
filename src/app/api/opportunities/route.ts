import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase/admin';

export async function GET() {
  try {
    console.log('Fetching opportunities from Firestore...');
    const opportunitiesSnapshot = await db.collection('opportunities').get();
    const opportunities = opportunitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Check if opportunity with same name exists
    const existingOpportunitySnapshot = await db
      .collection('opportunities')
      .where('name', '==', data.name)
      .get();

    if (!existingOpportunitySnapshot.empty) {
      return NextResponse.json(
        { error: 'Opportunity with this name already exists' },
        { status: 400 }
      );
    }

    // Create new opportunity
    const docRef = await db.collection('opportunities').add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const newOpportunitySnapshot = await docRef.get();
    const newOpportunity = {
      id: newOpportunitySnapshot.id,
      ...newOpportunitySnapshot.data(),
    };

    return NextResponse.json(newOpportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    // Update opportunity
    await db
      .collection('opportunities')
      .doc(id)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

    const updatedOpportunitySnapshot = await db.collection('opportunities').doc(id).get();
    const updatedOpportunity = {
      id: updatedOpportunitySnapshot.id,
      ...updatedOpportunitySnapshot.data(),
    };

    return NextResponse.json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    await db.collection('opportunities').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
