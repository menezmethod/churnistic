import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { UserRole } from '@/lib/auth/types';

interface TestAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

interface UserProfile {
  email: string;
  displayName: string;
  role: UserRole;
  notifications: {
    creditCardAlerts: boolean;
    bankBonusAlerts: boolean;
    investmentAlerts: boolean;
    riskAlerts: boolean;
  };
  privacy: {
    profileVisibility: string;
    showEmail: boolean;
    showActivity: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
  };
}

export const testAccounts: TestAccount[] = [
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

export async function setupTestAccounts(): Promise<void> {
  try {
    const auth = getAuth();
    const db = getFirestore();

    for (const account of testAccounts) {
      try {
        // Create user if doesn't exist
        let user;
        try {
          user = await auth.getUserByEmail(account.email);
          console.log(`Updating existing user: ${account.email}`);
        } catch {
          user = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName,
          });
          console.log(`Created new user: ${account.email}`);
        }

        // Set custom claims (role)
        await auth.setCustomUserClaims(user.uid, { role: account.role });
        console.log(`Set role ${account.role} for user: ${account.email}`);

        // Create initial profile document
        const userProfile: UserProfile = {
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
        };

        const userDoc = db.doc(`users/${user.uid}`);
        await userDoc.set(userProfile, { merge: true });
        console.log(`Created/updated profile for: ${account.email}`);
      } catch (error) {
        console.error(`Error setting up user ${account.email}:`, error);
      }
    }

    console.log('All test accounts have been set up successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test accounts:', error);
    process.exit(1);
  }
}
