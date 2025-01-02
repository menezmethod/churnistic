import * as admin from 'firebase-admin';
import { UserRole } from '../src/lib/auth/types';

// Initialize Firebase Admin
if (!process.env.NEXT_PUBLIC_ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error(
    'Required environment variables are not set (NEXT_PUBLIC_ADMIN_EMAIL, ADMIN_PASSWORD)'
  );
  process.exit(1);
}

// Always connect to emulators in this script
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize with project ID from env or fallback
admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'churnistic',
});

const auth = admin.auth();
const db = admin.firestore();

console.log('Connected to Firebase emulators');

async function setupAdmin() {
  // Type assertion since we already checked these exist
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL as string;
  const adminPassword = process.env.ADMIN_PASSWORD as string;

  try {
    console.log('Starting admin setup...');
    console.log('Using emulator at:', process.env.FIREBASE_AUTH_EMULATOR_HOST);

    // Try to get the user first
    let adminUser;
    try {
      adminUser = await auth.getUserByEmail(adminEmail);
      console.log('Admin user already exists');
    } catch (error) {
      console.log('Creating new admin user...');
      // Create the admin user if doesn't exist
      adminUser = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'Test Admin',
      });
      console.log('Created new admin user');
    }

    // Set admin claims
    const claims = {
      role: UserRole.ADMIN,
      isSuperAdmin: true,
    };

    await auth.setCustomUserClaims(adminUser.uid, claims);
    console.log('Set admin claims:', claims);

    // Create or update admin profile in Firestore
    const userProfile = {
      firebaseUid: adminUser.uid,
      email: adminEmail,
      displayName: 'Test Admin',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.doc(`users/${adminUser.uid}`).set(userProfile, { merge: true });
    console.log('Created/updated admin profile');

    // Force refresh the user to get the new claims
    await auth.revokeRefreshTokens(adminUser.uid);
    console.log('Revoked refresh tokens to force claims update');

    // Get the user again to verify claims
    const updatedUser = await auth.getUser(adminUser.uid);
    console.log('Verified user claims:', updatedUser.customClaims);

    console.log('\nAdmin setup completed successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('You can now log in with these credentials');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

setupAdmin();
