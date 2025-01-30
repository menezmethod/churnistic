import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

// Paths that require admin/superadmin role
const adminPaths = ['/admin'];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware - Processing request for path:', path);

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  const isAdminPath = adminPaths.some((prefix) => path.startsWith(prefix));
  console.log('Protected path match:', isProtectedPath ? path : 'none');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    console.log('No session cookie found');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    // Verify session cookie
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);

    // For admin paths, check if user has admin/superadmin role
    if (isAdminPath) {
      const userRole = decodedClaims.role;
      const isSuperAdmin =
        decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

      if (!isSuperAdmin && userRole !== 'admin') {
        console.log('User does not have admin privileges');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
