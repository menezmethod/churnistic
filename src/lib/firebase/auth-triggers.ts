import type { UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';

import type { DatabaseUser } from '@/types/user';

import { UserRole } from '../auth/types';

interface AuthEvent {
  type: 'created' | 'updated' | 'deleted';
  data: UserRecord;
}

// Trigger when a user is created or updated in Firebase Auth
export const onAuthUserChanged = onCall<AuthEvent>(async (request) => {
  const { type, data: user } = request.data;
  if (!user) return;

  try {
    const firestore = getFirestore();
    const userRef = firestore.collection('users').doc(user.uid);

    switch (type) {
      case 'created': {
        const userData: DatabaseUser = {
          id: user.uid,
          firebaseUid: user.uid,
          email: user.email || '',
          displayName: user.displayName || null,
          customDisplayName: null,
          photoURL: user.photoURL || null,
          role: UserRole.USER,
          status: 'active',
          creditScore: undefined,
          monthlyIncome: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          businessVerified: false,
        };

        await userRef.set(userData);
        console.log(`[Auth Trigger] Created Firestore user for: ${user.email}`);
        break;
      }

      case 'updated': {
        const userDoc = await userRef.get();
        const userData = userDoc.data() as DatabaseUser | undefined;

        if (!userData) return;

        // Update if email or display name changed
        if (userData.email !== user.email || userData.displayName !== user.displayName) {
          await userRef.update({
            email: user.email || '',
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[Auth Trigger] Updated Firestore user for: ${user.email}`);
        }
        break;
      }

      case 'deleted': {
        await userRef.delete();
        console.log(`[Auth Trigger] Deleted Firestore user for: ${user.email}`);
        break;
      }
    }
  } catch (error: unknown) {
    console.error(
      `Error in onAuthUser${type}:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
});
