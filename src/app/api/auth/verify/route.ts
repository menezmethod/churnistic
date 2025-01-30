import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie, requiredRole } = await request.json();
    console.log('Verifying session with role requirement:', requiredRole);

    if (!sessionCookie) {
      console.log('No session cookie provided');
      return NextResponse.json(
        { isValid: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    console.log('Session verified for user:', decodedClaims.email);

    // Check for admin/superadmin role if required
    if (requiredRole === 'admin') {
      const userRole = decodedClaims.role;
      const isSuperAdmin =
        decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

      console.log('Admin check:', {
        email: decodedClaims.email,
        role: userRole,
        isSuperAdmin,
        superAdminEmail: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
      });

      if (!isSuperAdmin && userRole !== 'admin') {
        console.log('User lacks required privileges');
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
