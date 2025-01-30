import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

// Paths that require admin/superadmin role
const adminPaths = ['/admin'];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/verify).*)'],
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
    // Verify session using the API route
    const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionCookie,
        requiredRole: isAdminPath ? 'admin' : undefined,
      }),
    });

    if (!verifyResponse.ok) {
      const { error } = await verifyResponse.json();
      console.log('Session verification failed:', error);

      if (verifyResponse.status === 403) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
