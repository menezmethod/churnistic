import { NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/admin';
import type { DatabaseUser } from '@/types/user';

export async function POST() {
  try {
    // Get all users from Firebase Auth
    const { users } = await auth.listUsers();
    console.log(`Found ${users.length} users in Firebase Auth`);

    const results = {
      total: users.length,
      created: 0,
      existing: 0,
      errors: 0,
    };

    // Sync each user to Firestore
    for (const firebaseUser of users) {
      try {
        // Check if user already exists in Firestore
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

        if (!userDoc.exists) {
          // Get user claims to determine role
          const { customClaims } = await auth.getUser(firebaseUser.uid);

          // Create user in Firestore
          const userData: DatabaseUser = {
            id: firebaseUser.uid,
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName:
              firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            customDisplayName: null,
            photoURL: firebaseUser.photoURL || null,
            role:
              customClaims?.role === UserRole.ADMIN
                ? UserRole.ADMIN
                : customClaims?.role === UserRole.MANAGER
                  ? UserRole.MANAGER
                  : UserRole.USER,
            status: 'active',
            creditScore: undefined,
            monthlyIncome: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            businessVerified: false,
          };

          await db.collection('users').doc(firebaseUser.uid).set(userData);
          console.log(`Created Firestore user for: ${firebaseUser.email}`);
          results.created++;
        } else {
          console.log(`User already exists in Firestore: ${firebaseUser.email}`);
          results.existing++;
        }
      } catch (error) {
        console.error(`Error syncing user ${firebaseUser.email}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
