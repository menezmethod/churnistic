import type { Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';

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

    // Sync each user to MongoDB
    for (const firebaseUser of users) {
      try {
        // Check if user already exists in MongoDB
        const existingUser = await prisma.user.findUnique({
          where: { firebaseUid: firebaseUser.uid },
        });

        if (!existingUser) {
          // Create user in MongoDB
          const userData: Prisma.UserCreateInput = {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName:
              firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
            photoURL: firebaseUser.photoURL || null,
            role: ((firebaseUser.customClaims?.role as UserRole) ||
              UserRole.USER) as UserRole,
            status: 'active',
          };

          await prisma.user.create({ data: userData });
          console.log(`Created MongoDB user for: ${firebaseUser.email}`);
          results.created++;
        } else {
          console.log(`User already exists in MongoDB: ${firebaseUser.email}`);
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
