import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie, requiredRole } = await request.json();
    console.log('Verify endpoint called with role requirement:', requiredRole);

    if (!sessionCookie) {
      console.log('No session cookie in request body');
      return NextResponse.json(
        { isValid: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

    // Get the auth instance
    const auth = getAdminAuth();
    console.log('Attempting to verify session cookie...');

    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      console.log('Session verified successfully for:', decodedClaims.email);

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
          console.log('User lacks required privileges:', {
            email: decodedClaims.email,
            role: userRole,
            requiredRole,
          });
          return NextResponse.json(
            { isValid: false, error: 'Insufficient privileges' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        isValid: true,
        user: {
          ...decodedClaims,
          isSuperAdmin: decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
        },
      });
    } catch (verifyError) {
      console.error('Session verification failed:', verifyError);
      return NextResponse.json(
        { isValid: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    return NextResponse.json({ isValid: false, error: 'Server error' }, { status: 500 });
  }
}
