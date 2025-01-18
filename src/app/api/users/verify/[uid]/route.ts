import { Timestamp } from 'firebase-admin/firestore';
import { type NextRequest } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const db = getAdminDb();
    const { uid } = await params;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return new Response('User not found', { status: 404 });
    }

    await userRef.update({
      businessVerified: true,
      updatedAt: Timestamp.now(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
