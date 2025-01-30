import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie, requiredRole } = await request.json();

    if (!sessionCookie) {
      return NextResponse.json(
        { isValid: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Check for admin/superadmin role if required
    if (requiredRole === 'admin') {
      const userRole = decodedClaims.role;
      const isSuperAdmin =
        decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

      if (!isSuperAdmin && userRole !== 'admin') {
        return NextResponse.json(
          { isValid: false, error: 'Insufficient privileges' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ isValid: true, user: decodedClaims });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { isValid: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}
