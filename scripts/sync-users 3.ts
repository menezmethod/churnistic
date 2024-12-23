import { auth } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/auth/types';
import type { Prisma } from '@prisma/client';

async function syncUsers() {
  try {
    // Get all users from Firebase Auth
    const { users } = await auth.listUsers();
    console.log(`Found ${users.length} users in Firebase Auth`);

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
        } else {
          console.log(`User already exists in MongoDB: ${firebaseUser.email}`);
        }
      } catch (error) {
        console.error(`Error syncing user ${firebaseUser.email}:`, error);
      }
    }

    console.log('User sync completed');
  } catch (error) {
    console.error('Error syncing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncUsers();
