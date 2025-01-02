import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserRole, ROLE_PERMISSIONS } from '@/lib/auth/types';
import { auth, db } from '@/lib/firebase/admin';

// Validation schemas
const initializeClaimsSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
});

interface UserClaims {
  role: UserRole;
  permissions: string[];
  isSuperAdmin: boolean;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            details: 'Could not parse JSON body',
          },
        },
        { status: 400 }
      );
    }

    try {
      const { uid } = initializeClaimsSchema.parse(body);
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();

      if (!userData) {
        return NextResponse.json(
          {
            error: {
              message: 'User not found',
              details: `No user found with ID: ${uid}`,
            },
          },
          { status: 404 }
        );
      }

      const userRole = userData.role as UserRole;
      const claims: UserClaims = {
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[UserRole.USER],
        isSuperAdmin: userRole === UserRole.ADMIN,
      };

      await auth.setCustomUserClaims(uid, claims);

      return NextResponse.json({
        data: {
          success: true,
          claims,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              message: 'Invalid request data',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      throw error; // Let the outer catch block handle other errors
    }
  } catch (error) {
    console.error('Error initializing claims:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to initialize claims',
          details: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
