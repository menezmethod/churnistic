import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { getAdminApp } from '@/lib/firebase/admin';

export async function verifySessionCookie(sessionCookie: string) {
  try {
    const auth = getAuth(getAdminApp());
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const db = getFirestore(getAdminApp());
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      throw new Error('User document not found');
    }

    return {
      ...decodedToken,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Failed to verify session:', error);
    throw error;
  }
}
