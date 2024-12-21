import type { Prisma } from '@prisma/client';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

import { UserRole } from '../auth/types';
import { prisma } from '../prisma';

// Trigger when a new user is created in Firebase Auth
export const onAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  const userData: Prisma.UserCreateInput = {
    firebaseUid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || '',
    photoURL: user.photoURL || null,
    role: ((user.customClaims?.role as UserRole) || UserRole.USER) as UserRole,
    status: 'active',
  };

  try {
    // Create user in MongoDB
    await prisma.user.create({ data: userData });
    console.log(`[Auth Trigger] Created MongoDB user for: ${user.email}`);

    // Create user profile in Firestore with default values
    const firestore = getFirestore();
    const userProfileData = {
      displayName: user.displayName || user.email?.split('@')[0] || '',
      customDisplayName: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
      bio: '',
      photoURL: user.photoURL || null,
      emailPreferences: {
        marketing: true,
        security: true,
      },
      notifications: {
        creditCardAlerts: true,
        bankBonusAlerts: true,
        investmentAlerts: true,
        riskAlerts: true,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true,
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(user.uid).set(userProfileData);
    console.log(`[Auth Trigger] Created Firestore profile for: ${user.email}`);
  } catch (error) {
    console.error(`[Auth Trigger] Error creating user for ${user.email}:`, error);
    throw error; // Rethrowing to ensure Firebase knows the operation failed
  }
});

// Trigger when a user is updated in Firebase Auth
export const onAuthUserUpdated = functions.auth.user().onUpdate(async (change) => {
  const before = change.before;
  const after = change.after;

  try {
    const updates: Prisma.UserUpdateInput = {};
    let hasChanges = false;

    // Only update fields that have changed
    if (before.email !== after.email) {
      updates.email = after.email || '';
      hasChanges = true;
    }
    if (before.displayName !== after.displayName) {
      updates.displayName = after.displayName || after.email?.split('@')[0] || '';
      hasChanges = true;
    }
    if (before.photoURL !== after.photoURL) {
      updates.photoURL = after.photoURL || null;
      hasChanges = true;
    }
    if (before.customClaims?.role !== after.customClaims?.role) {
      updates.role = ((after.customClaims?.role as UserRole) ||
        UserRole.USER) as UserRole;
      hasChanges = true;
    }

    if (hasChanges) {
      // Update MongoDB
      await prisma.user.update({
        where: { firebaseUid: after.uid },
        data: updates,
      });
      console.log(`[Auth Trigger] Updated MongoDB user for: ${after.email}`);

      // Update Firestore
      const firestore = getFirestore();
      const userRef = firestore.collection('users').doc(after.uid);
      await userRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Auth Trigger] Updated Firestore profile for: ${after.email}`);
    }
  } catch (error) {
    console.error(`[Auth Trigger] Error updating user for ${after.email}:`, error);
    throw error;
  }
});

// Trigger when a user is deleted in Firebase Auth
export const onAuthUserDeleted = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete from MongoDB
    await prisma.user.delete({
      where: { firebaseUid: user.uid },
    });
    console.log(`[Auth Trigger] Deleted MongoDB user for: ${user.email}`);

    // Delete from Firestore
    const firestore = getFirestore();
    await firestore.collection('users').doc(user.uid).delete();
    console.log(`[Auth Trigger] Deleted Firestore profile for: ${user.email}`);
  } catch (error) {
    console.error(`[Auth Trigger] Error deleting user for ${user.email}:`, error);
    throw error;
  }
});
