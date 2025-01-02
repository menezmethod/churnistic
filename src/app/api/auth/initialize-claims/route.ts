import { type NextRequest } from 'next/server';

import { UserRole, ROLE_PERMISSIONS } from '@/lib/auth/types';
import { auth, db } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const { uid } = await request.json();

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const permissions =
      ROLE_PERMISSIONS[userData.role as UserRole] || ROLE_PERMISSIONS[UserRole.USER];

    await auth.setCustomUserClaims(uid, {
      role: userData.role,
      permissions,
      isSuperAdmin: userData.role === UserRole.ADMIN,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error initializing claims:', error);
    return Response.json({ error: 'Failed to initialize claims' }, { status: 500 });
  }
}
