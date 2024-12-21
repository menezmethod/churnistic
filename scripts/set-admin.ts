// Set environment variables before importing anything
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = 'true';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

import { auth } from '../src/lib/firebase/admin';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../src/lib/auth/types';

// Test users to set up
const TEST_USERS = [
  {
    email: 'menezfd@gmail.com',
    password: 'testpassword123',
    displayName: 'Super Admin',
    role: UserRole.ADMIN,
    isSuperAdmin: true, // Special flag for the main admin
  },
  {
    email: 'admin@test.com',
    password: 'testpassword123',
    displayName: 'Test Admin',
    role: UserRole.ADMIN,
  },
  {
    email: 'manager@test.com',
    password: 'testpassword123',
    displayName: 'Test Manager',
    role: UserRole.MANAGER,
  },
  {
    email: 'analyst@test.com',
    password: 'testpassword123',
    displayName: 'Test Analyst',
    role: UserRole.ANALYST,
  },
  {
    email: 'agent@test.com',
    password: 'testpassword123',
    displayName: 'Test Agent',
    role: UserRole.AGENT,
  },
  {
    email: 'user@test.com',
    password: 'testpassword123',
    displayName: 'Test User',
    role: UserRole.USER,
  },
  {
    email: 'free@test.com',
    password: 'testpassword123',
    displayName: 'Test Free User',
    role: UserRole.FREE_USER,
  },
] as const;

async function verifyUserClaims(email: string) {
  try {
    const user = await auth.getUserByEmail(email);
    console.log('\nCurrent claims for', email, ':', user.customClaims);
    return user.customClaims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    return null;
  }
}

async function setUserRole(email: string, role: UserRole, displayName: string, password: string, isSuperAdmin = false) {
  try {
    console.log(`\nSetting up user: ${email} with role: ${role}`);
    
    let user;
    try {
      // Try to get the user first
      user = await auth.getUserByEmail(email);
      console.log('User found:', user.uid);
      
      // Log current claims before update
      console.log('Current claims:', user.customClaims);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create the user if they don't exist
        console.log('User not found, creating new user...');
        user = await auth.createUser({
          email,
          password,
          displayName,
        });
        console.log('User created:', user.uid);
      } else {
        throw error;
      }
    }

    // Set custom claims with role and permissions
    const claims = {
      role,
      permissions: ROLE_PERMISSIONS[role],
      ...(isSuperAdmin && { isSuperAdmin: true }),
    };
    
    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`Setting claims:`, claims);
    
    // Verify the claims were set correctly
    const updatedClaims = await verifyUserClaims(email);
    if (!updatedClaims) {
      throw new Error('Failed to verify updated claims');
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting ${role} role:`, error);
    return false;
  }
}

async function setupAllUsers() {
  console.log('Setting up all test users...');
  
  for (const user of TEST_USERS) {
    const success = await setUserRole(
      user.email,
      user.role,
      user.displayName,
      user.password,
      'isSuperAdmin' in user ? user.isSuperAdmin : false
    );
    if (!success) {
      console.error(`Failed to set up user: ${user.email}`);
      process.exit(1);
    }
  }
  
  console.log('\nVerifying all user claims:');
  for (const user of TEST_USERS) {
    await verifyUserClaims(user.email);
  }
  
  console.log('\nSuccessfully set up all test users');
  process.exit(0);
}

setupAllUsers(); 