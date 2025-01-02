import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { db } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ uid: string }> }
) {
  const params = await props.params;
  try {
    const userDoc = await db.collection('users').doc(params.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 });
  }
}
