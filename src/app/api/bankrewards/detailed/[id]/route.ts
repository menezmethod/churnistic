import { doc, getDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase/firebase';

type Context = {
  params: Promise<{ id: string | string[] | undefined }>;
};

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const params = await context.params;
    const offerId = typeof params.id === 'string' ? params.id : params.id?.[0] || '';
    const docRef = doc(db, 'bankrewards', offerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching detailed offer:', error);
    return NextResponse.json({ error: 'Failed to fetch offer details' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
