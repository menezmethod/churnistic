import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that ALWAYS require authentication
const protectedPaths = [
  '/dashboard',
  '/admin',
  '/api/users',
  '/api/opportunities/import',
  '/api/opportunities/staged',
  '/api/opportunities/approve',
  '/api/opportunities/reject',
  '/api/opportunities/reset',
];

// Public API endpoints and paths
const publicEndpoints = [
  '/api/opportunities/public-stats',
  '/api/opportunities',
  '/opportunities',
  '/opportunities/:id',
  '/api/auth/verify-session',
];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth check for public paths
  if (
    publicEndpoints.includes(path) ||
    path.startsWith('/auth') ||
    path.startsWith('/api/auth') ||
    path === '/'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Redirect to signin only if session cookie is missing
    if (protectedPaths.some((p) => path.startsWith(p))) {
      // Only redirect for protected paths
      const searchParams = new URLSearchParams([['redirect', request.nextUrl.pathname]]);
      return NextResponse.redirect(new URL(`/auth/signin?${searchParams}`, request.url));
    }
    return NextResponse.next(); // Allow public paths even without session
  }

  try {
    // Verify session in API route
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        Cookie: `session=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      // Session invalid, but don't redirect immediately, let client-side handle it for smoother UX
      return NextResponse.next(); // Just proceed without session for now
    }

    return NextResponse.next(); // Session valid, proceed
  } catch {
    // Verification error, same as invalid session - proceed without redirect for now
    return NextResponse.next();
  }
}
