import { PrismaClient, UserRole } from '@prisma/client';
import * as admin from 'firebase-admin';

const prisma = new PrismaClient();

// Initialize Firebase Admin with emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
admin.initializeApp({
  projectId: 'churnistic',
});

const testAccounts = [
  {
    email: 'menezfd@gmail.com',
    password: 'testpass123',
    displayName: 'Luis Gimenez',
    role: 'admin' as UserRole,
    isSuperAdmin: true,
  },
  {
    email: 'admin@test.com',
    password: 'testpass123',
    displayName: 'Test Admin',
    role: 'admin' as UserRole,
  },
  {
    email: 'manager@test.com',
    password: 'testpass123',
    displayName: 'Test Manager',
    role: 'manager' as UserRole,
  },
  {
    email: 'analyst@test.com',
    password: 'testpass123',
    displayName: 'Test Analyst',
    role: 'analyst' as UserRole,
  },
  {
    email: 'agent@test.com',
    password: 'testpass123',
    displayName: 'Test Agent',
    role: 'agent' as UserRole,
  },
  {
    email: 'user@test.com',
    password: 'testpass123',
    displayName: 'Test User',
    role: 'user' as UserRole,
  },
  {
    email: 'free@test.com',
    password: 'testpass123',
    displayName: 'Test Free User',
    role: 'free_user' as UserRole,
  },
];

async function setupTestAccounts() {
  try {
    // First, create or get Firebase users
    const firebaseUsers = await Promise.all(
      testAccounts.map(async (account) => {
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().getUserByEmail(account.email);
          console.log(`Firebase user exists: ${account.email}`);
        } catch {
          firebaseUser = await admin.auth().createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName,
          });
          console.log(`Created Firebase user: ${account.email}`);
        }

        // Set custom claims
        const claims = {
          role: account.role.toLowerCase(),
          permissions:
            account.role === UserRole.admin
              ? [
                  'users.view',
                  'users.create',
                  'users.edit',
                  'users.delete',
                  'roles.assign',
                ]
              : [],
          ...(account.isSuperAdmin && { isSuperAdmin: true }),
        };
        await admin.auth().setCustomUserClaims(firebaseUser.uid, claims);
        console.log(`Set claims for user: ${account.email}`, claims);

        return { ...account, firebaseUid: firebaseUser.uid };
      })
    );

    // Then, create or update MongoDB users
    for (const account of firebaseUsers) {
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {
          displayName: account.displayName,
          role: account.role,
          status: 'active',
          firebaseUid: account.firebaseUid,
        },
        create: {
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          status: 'active',
          businessVerified: false,
          firebaseUid: account.firebaseUid,
        },
      });
      console.log(`Created/updated MongoDB user: ${user.email} with role ${user.role}`);
    }

    console.log('All test accounts have been set up successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test accounts:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the setup
setupTestAccounts();
