import { Timestamp } from 'firebase-admin/firestore';

import { UserRole } from '@/lib/auth/types';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST() {
  try {
    const auth = getAdminAuth();
    const { users } = await auth.listUsers();
    const db = getAdminDb();

    const operations = users.map(async (firebaseUser) => {
      try {
        // Get existing user document
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

        // If user document doesn't exist, create it
        if (!userDoc.exists) {
          const { customClaims } = await auth.getUser(firebaseUser.uid);
          const now = Timestamp.now();

          const userData = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: customClaims?.role || UserRole.USER,
            isSuperAdmin: false,
            createdAt: now,
            updatedAt: now,
          };

          await db.collection('users').doc(firebaseUser.uid).set(userData);
          return { status: 'created', uid: firebaseUser.uid };
        }

        return { status: 'exists', uid: firebaseUser.uid };
      } catch (error) {
        console.error(`Error processing user ${firebaseUser.uid}:`, error);
        return { status: 'error', uid: firebaseUser.uid, error };
      }
    });

    const results = await Promise.all(operations);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
