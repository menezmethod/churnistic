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
];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware - Processing request for path:', path);

  // Check if path is public or starts with a public path
  if (
    publicEndpoints.some(
      (endpoint) => path === endpoint || path.startsWith(`${endpoint}/`)
    )
  ) {
    console.log('Public endpoint accessed:', path);
    return NextResponse.next();
  }

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));

  // If path is not protected, allow access
  if (!isProtectedPath) {
    console.log('Public path accessed:', path);
    return NextResponse.next();
  }

  // For protected paths, check authentication
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('session')?.value;
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  // In emulator mode, accept any auth
  if (useEmulators && (authHeader?.startsWith('Bearer ') || sessionCookie)) {
    console.log('🔧 Emulator mode - accepting auth');
    return NextResponse.next();
  }

  // In production, require either valid auth header or session cookie
  if (!authHeader && !sessionCookie) {
    console.log('No auth found - redirecting to signin');
    const searchParams = new URLSearchParams([['redirect', path]]);
    return NextResponse.redirect(new URL(`/auth/signin?${searchParams}`, request.url));
  }

  return NextResponse.next();
}
