import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { UserRole } from '@/lib/auth/types';
import { auth } from '@/lib/firebase/admin';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json();

    // Get user from MongoDB to sync roles
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!dbUser) {
      // If user doesn't exist in MongoDB, create them with default role
      const newUser = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: email,
          role: UserRole.USER,
          status: 'active',
        },
      });
      console.log('Created new user in MongoDB:', newUser);

      // Set default claims for new user
      const claims = {
        role: UserRole.USER,
        permissions: ROLE_PERMISSIONS[UserRole.USER],
        isSuperAdmin: false,
      };

      // Set custom claims in Firebase
      await auth.setCustomUserClaims(uid, claims);

      // Create custom token
      const currentToken = await auth.createCustomToken(uid);

      console.log('Initialized claims for new user:', {
        email,
        claims,
        token: currentToken,
      });

      return NextResponse.json({
        success: true,
        claims,
        token: currentToken,
      });
    }

    // Get permissions based on user's role
    const rolePermissions =
      ROLE_PERMISSIONS[dbUser.role as UserRole] || ROLE_PERMISSIONS[UserRole.USER];

    // Set claims based on user's role
    const claims = {
      role: dbUser.role,
      permissions: rolePermissions,
      isSuperAdmin: dbUser.role === UserRole.ADMIN,
    };

    // Set custom claims in Firebase
    await auth.setCustomUserClaims(uid, claims);

    // Create custom token
    const currentToken = await auth.createCustomToken(uid);

    console.log('Initialized claims for existing user:', {
      email,
      claims,
      token: currentToken,
    });

    return NextResponse.json({
      success: true,
      claims,
      token: currentToken,
    });
  } catch (error) {
    console.error('Error initializing user claims:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user claims' },
      { status: 500 }
    );
  }
}
