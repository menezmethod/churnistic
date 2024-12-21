import * as admin from 'firebase-admin';
import { UserRole } from '../src/lib/auth/types';

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const testAccounts = [
  {
    email: 'admin@test.com',
    password: 'testpass123',
    displayName: 'Test Admin',
    role: UserRole.ADMIN,
  },
  {
    email: 'manager@test.com',
    password: 'testpass123',
    displayName: 'Test Manager',
    role: UserRole.MANAGER,
  },
  {
    email: 'analyst@test.com',
    password: 'testpass123',
    displayName: 'Test Analyst',
    role: UserRole.ANALYST,
  },
  {
    email: 'agent@test.com',
    password: 'testpass123',
    displayName: 'Test Agent',
    role: UserRole.AGENT,
  },
  {
    email: 'user@test.com',
    password: 'testpass123',
    displayName: 'Test User',
    role: UserRole.USER,
  },
  {
    email: 'free@test.com',
    password: 'testpass123',
    displayName: 'Test Free User',
    role: UserRole.FREE_USER,
  },
];

async function setupTestAccounts() {
  try {
    for (const account of testAccounts) {
      // Create or update user
      let user;
      try {
        user = await admin.auth().getUserByEmail(account.email);
        console.log(`Updating existing user: ${account.email}`);
      } catch {
        user = await admin.auth().createUser({
          email: account.email,
          password: account.password,
          displayName: account.displayName,
        });
        console.log(`Created new user: ${account.email}`);
      }

      // Set custom claims (role)
      await admin.auth().setCustomUserClaims(user.uid, { role: account.role });
      console.log(`Set role ${account.role} for user: ${account.email}`);

      // Create initial profile document
      const userDoc = admin.firestore().doc(`users/${user.uid}`);
      await userDoc.set(
        {
          email: account.email,
          displayName: account.displayName,
          role: account.role,
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
            timezone: 'UTC',
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`Created/updated profile for: ${account.email}`);
    }

    console.log('All test accounts have been set up successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test accounts:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestAccounts();
