import type { Prisma } from '@prisma/client';
import type { UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';

import { UserRole } from '../auth/types';
import { prisma } from '../prisma';

interface AuthEvent {
  type: 'created' | 'updated' | 'deleted';
  data: UserRecord;
}

// Trigger when a user is created or updated in Firebase Auth
export const onAuthUserChanged = onCall<AuthEvent>(async (request) => {
  const { type, data: user } = request.data;
  if (!user) return;

  try {
    switch (type) {
      case 'created': {
        const userData: Prisma.UserCreateInput = {
          firebaseUid: user.uid,
          email: user.email || '',
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          role: UserRole.USER,
          status: 'active',
        };

        // Create user in MongoDB
        await prisma.user.create({ data: userData });
        console.log(`[Auth Trigger] Created MongoDB user for: ${user.email}`);

        // Create user profile in Firestore
        const firestore = getFirestore();
        const userProfileData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: UserRole.USER,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        await firestore.collection('users').doc(user.uid).set(userProfileData);
        console.log(`[Auth Trigger] Created Firestore profile for: ${user.email}`);
        break;
      }

      case 'updated': {
        // Get the current user data from Firestore
        const firestore = getFirestore();
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (!userData) return;

        // Update in MongoDB if email or display name changed
        if (userData.email !== user.email || userData.displayName !== user.displayName) {
          await prisma.user.update({
            where: { firebaseUid: user.uid },
            data: {
              email: user.email || '',
              displayName: user.displayName || null,
              photoURL: user.photoURL || null,
            },
          });
          console.log(`[Auth Trigger] Updated MongoDB user for: ${user.email}`);

          // Update in Firestore
          await firestore.collection('users').doc(user.uid).update({
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[Auth Trigger] Updated Firestore profile for: ${user.email}`);
        }
        break;
      }

      case 'deleted': {
        // Delete from MongoDB
        await prisma.user.delete({
          where: { firebaseUid: user.uid },
        });
        console.log(`[Auth Trigger] Deleted MongoDB user for: ${user.email}`);

        // Delete from Firestore
        const firestore = getFirestore();
        await firestore.collection('users').doc(user.uid).delete();
        console.log(`[Auth Trigger] Deleted Firestore profile for: ${user.email}`);
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
