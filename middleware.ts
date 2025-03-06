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
const publicPaths = [
  '/', // Homepage
  '/auth', // Auth pages
  '/opportunities', // Opportunity pages
  '/api/auth', // Auth API routes
  '/api/opportunities/public-stats', // Public stats
  '/api/opportunities', // Featured opportunities
  '/_next', // Next.js internals
  '/assets', // Static assets
  '/favicon.ico', // Favicon
];

/**
 * Helper function to check if a path matches any patterns in a list
 */
function matchesAnyPath(pathname: string, pathPatterns: string[]): boolean {
  return pathPatterns.some((pattern: string) => pathname.startsWith(pattern));
}

/**
 * Middleware function that runs before matching routes
 */
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Add timestamp in request header for debugging/cache-busting
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-middleware-timestamp', Date.now().toString());

  // Get the session cookie
  const sessionCookie = request.cookies.get('session');

  // Check if path needs authentication
  const isProtectedPath = matchesAnyPath(pathname, protectedPaths);
  const isStaticResource = pathname.includes('.');
  const isPublicPath = matchesAnyPath(pathname, publicPaths) || isStaticResource;

  // If not authenticated and trying to access protected path
  if (isProtectedPath && !sessionCookie) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // For other protected routes, redirect to login
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);

    console.log(
      `[Middleware] Redirecting unauthenticated request from ${pathname} to login`
    );
    return NextResponse.redirect(redirectUrl);
  }

  // For all other routes, proceed with updated headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which paths the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
