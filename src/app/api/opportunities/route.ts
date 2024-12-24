import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma/db';

export async function GET() {
  try {
    console.log('Fetching opportunities from Prisma...');
    const opportunities = await prisma.opportunity.findMany({
      orderBy: [{ confidence: 'desc' }, { postedDate: 'desc' }],
      where: {
        status: 'active',
      },
    });

    console.log(`Found ${opportunities.length} opportunities`);
    console.log('First opportunity:', opportunities[0]);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const opportunity = await request.json();

    // Convert dates from strings to Date objects
    const dbOpportunity = {
      ...opportunity,
      postedDate: new Date(opportunity.postedDate),
      expirationDate: opportunity.expirationDate
        ? new Date(opportunity.expirationDate)
        : null,
      value: parseFloat(opportunity.value.toString()), // Ensure value is a number
      confidence: parseFloat(opportunity.confidence.toString()), // Ensure confidence is a number
    };

    // Check if opportunity already exists
    const existingOpportunity = await prisma.opportunity.findFirst({
      where: {
        sourceId: dbOpportunity.sourceId,
      },
    });

    if (existingOpportunity) {
      // Update if new opportunity has higher confidence
      if (dbOpportunity.confidence > existingOpportunity.confidence) {
        console.log(
          'Updating existing opportunity with higher confidence:',
          dbOpportunity.sourceId
        );
        const updatedOpportunity = await prisma.opportunity.update({
          where: { id: existingOpportunity.id },
          data: dbOpportunity,
        });
        return NextResponse.json(updatedOpportunity);
      }
      console.log('Skipping update for existing opportunity:', dbOpportunity.sourceId);
      return NextResponse.json(existingOpportunity);
    }

    // Create new opportunity
    console.log('Creating new opportunity:', dbOpportunity.sourceId);
    const newOpportunity = await prisma.opportunity.create({
      data: dbOpportunity,
    });

    return NextResponse.json(newOpportunity);
  } catch (error) {
    console.error('Error saving opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to save opportunity',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 });
    }

    await prisma.opportunity.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
