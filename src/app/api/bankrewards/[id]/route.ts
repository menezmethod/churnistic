import { NextRequest, NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection('bankrewards').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json({
      id: docSnap.id,
      ...data,
      metadata: {
        created_at: data?.metadata?.created_at || new Date().toISOString(),
        updated_at: data?.metadata?.updated_at || new Date().toISOString(),
        status: data?.metadata?.status || 'active',
      },
    });
  } catch (error) {
    console.error('Error fetching bank rewards offer:', error);
    return NextResponse.json({ error: 'Failed to fetch offer details' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
