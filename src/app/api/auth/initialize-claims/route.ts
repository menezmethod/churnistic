import { type NextRequest } from 'next/server';

import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { UserRole } from '@/lib/auth/types';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return new Response('Missing uid', { status: 400 });
    }

    // Get user document
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();

    // Default claims
    const claims = {
      role: UserRole.FREE_USER,
      permissions: ROLE_PERMISSIONS[UserRole.FREE_USER],
    };

    // If user document exists, use role from document
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.role) {
        claims.role = userData.role;
        claims.permissions = ROLE_PERMISSIONS[userData.role as UserRole] || [];
      }
    }

    // Set custom claims
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, claims);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initializing claims:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const dynamic = 'force-dynamic';
