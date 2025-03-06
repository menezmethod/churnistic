import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the routes configuration with more descriptive organization
const ROUTES_CONFIG = {
  // Routes that always require authentication
  protected: [
    // Dashboard and admin routes
    '/dashboard',
    '/admin',

    // Protected API routes
    '/api/users',
    '/api/opportunities/import',
    '/api/opportunities/staged',
    '/api/opportunities/approve',
    '/api/opportunities/reject',
    '/api/opportunities/reset',
  ],

  // Public API endpoints and paths
  public: [
    '/api/opportunities/public-stats',
    '/api/opportunities',
    '/opportunities',
    '/api/auth/verify-session',
    '/',
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
  ],

  // Assets and static paths to exclude from middleware
  excluded: [
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/images',
    '/assets',
  ],
};

/**
 * Middleware configuration
 * - Enhanced matcher pattern to exclude static assets
 */
export const config = {
  // Matcher for efficiently applying middleware only to necessary routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, manifest.json, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|sitemap.xml|images|assets).*)',
  ],
};

/**
 * Check if a path matches any patterns in the provided list
 * @param path - The path to check
 * @param patterns - List of path patterns to match against
 * @returns True if the path matches any pattern
 */
function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path === pattern || path.startsWith(pattern));
}

/**
 * Middleware function that runs before the request is completed
 * Handles authentication and redirects for protected routes
 *
 * @param request - The Next.js request object
 * @returns A modified response or the original request
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (matchesPath(pathname, ROUTES_CONFIG.excluded)) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (
    matchesPath(pathname, ROUTES_CONFIG.public) ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get('session')?.value;

  // If no session, handle accordingly
  if (!sessionCookie) {
    return handleUnauthenticated(request, pathname);
  }

  try {
    // Verify session using the API route
    const verifyUrl = new URL('/api/auth/verify-session', request.url);
    const response = await fetch(verifyUrl, {
      headers: {
        Cookie: `session=${sessionCookie}`,
      },
      method: 'GET',
    });

    if (!response.ok) {
      return handleInvalidSession(request, pathname);
    }

    // Session is valid, proceed with the request
    return NextResponse.next();
  } catch (error) {
    console.error(
      'Middleware error:',
      error instanceof Error ? error.message : String(error)
    );
    return handleError(pathname);
  }
}

/**
 * Handle unauthenticated requests
 * @param request - The original request
 * @param pathname - The current pathname
 * @returns Appropriate response based on the request type
 */
function handleUnauthenticated(request: NextRequest, pathname: string): NextResponse {
  if (matchesPath(pathname, ROUTES_CONFIG.protected)) {
    const searchParams = new URLSearchParams([['redirect', pathname]]);
    const signinUrl = new URL(`/auth/signin?${searchParams}`, request.url);

    // Use JSON response for API routes, redirect for regular routes
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.redirect(signinUrl);
  }

  // For non-protected routes without session, just proceed
  return NextResponse.next();
}

/**
 * Handle invalid session scenarios
 * @param request - The original request
 * @param pathname - The current pathname
 * @returns Appropriate response based on the request type
 */
function handleInvalidSession(request: NextRequest, pathname: string): NextResponse {
  // For API routes, return unauthorized error
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // For protected routes, redirect to signin
  if (matchesPath(pathname, ROUTES_CONFIG.protected)) {
    const searchParams = new URLSearchParams([['redirect', pathname]]);
    return NextResponse.redirect(new URL(`/auth/signin?${searchParams}`, request.url));
  }

  // Clear invalid session cookie and proceed
  const response = NextResponse.next();
  response.cookies.delete('session');
  return response;
}

/**
 * Handle error scenarios
 * @param pathname - The current pathname
 * @returns Appropriate response based on the request type
 */
function handleError(pathname: string): NextResponse {
  // For API routes, return error
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }

  // For regular routes, proceed but with an error passed via header
  const response = NextResponse.next();
  response.headers.set('X-Auth-Error', 'true');
  return response;
}
