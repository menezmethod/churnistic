import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Log request details
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Verify endpoint - Headers:', {
      ...headers,
      cookie: headers.cookie ? 'present' : 'missing',
    });

    // Ensure the request is JSON
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json(
        { isValid: false, error: 'Invalid content type' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { isValid: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { sessionCookie, requiredRole } = body;

    // Log environment and request state
    console.log('Verify endpoint - Request state:', {
      sessionCookiePresent: !!sessionCookie,
      sessionCookieLength: sessionCookie?.length,
      requiredRole,
      env: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasSuperAdmin: !!process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
      },
    });

    if (!sessionCookie) {
      console.log('No session cookie in request body');
      return NextResponse.json(
        { isValid: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

    // Get the auth instance
    const auth = getAdminAuth();
    if (!auth) {
      console.error('Failed to initialize Firebase Admin');
      return NextResponse.json(
        { isValid: false, error: 'Auth initialization failed' },
        { status: 500 }
      );
    }

    console.log('Attempting to verify session cookie...');

    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      console.log('Session verified successfully for:', decodedClaims.email);

      // Check for admin/superadmin role if required
      if (requiredRole === 'admin') {
        const userRole = decodedClaims.role;
        const isSuperAdmin =
          decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

        console.log('Admin access check:', {
          email: decodedClaims.email,
          role: userRole,
          isSuperAdmin,
          superAdminEmail: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.slice(0, 3) + '...',
          hasAccess: isSuperAdmin || userRole === 'admin',
          reason: isSuperAdmin
            ? 'Super Admin'
            : userRole === 'admin'
              ? 'Admin Role'
              : 'No Access',
        });

        // If user is Super Admin, grant access regardless of role
        if (isSuperAdmin) {
          console.log('Granting access to Super Admin');
          // Continue with access granted
        } else if (userRole !== 'admin') {
          // Only check role if not Super Admin
          console.log('User lacks required privileges:', {
            email: decodedClaims.email,
            role: userRole,
            requiredRole,
            isSuperAdmin,
            reason: 'Not Super Admin and no Admin role',
          });
          return NextResponse.json(
            { isValid: false, error: 'Insufficient privileges' },
            { status: 403 }
          );
        }
      }

      // Set CORS headers
      const response = NextResponse.json({
        isValid: true,
        user: {
          ...decodedClaims,
          isSuperAdmin: decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
          // Ensure role is set for consistency
          role:
            decodedClaims.role ||
            (decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
              ? 'admin'
              : 'user'),
        },
      });

      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return response;
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
