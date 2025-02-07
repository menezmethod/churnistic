import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users', '/api/opportunities'];

// Public API endpoints
const publicEndpoints = ['/api/opportunities/stats', '/api/opportunities/public-stats'];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware - Processing request for path:', path);

  // Check if path is public
  if (publicEndpoints.includes(path)) {
    return NextResponse.next();
  }

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  console.log('Protected path match:', isProtectedPath ? path : 'none');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for auth header or session cookie
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('session')?.value;
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  // In emulator mode, accept any auth
  if (useEmulators) {
    if (authHeader?.startsWith('Bearer ') || sessionCookie) {
      console.log('🔧 Emulator mode - accepting auth');
      return NextResponse.next();
    }
  }

  // In production, require either valid auth header or session cookie
  if (!authHeader && !sessionCookie) {
    console.log('No auth found - redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Let the request through - actual token verification happens in createAuthContext
  return NextResponse.next();
}
