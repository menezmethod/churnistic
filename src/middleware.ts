import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware - Processing request for path:', path);

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  console.log('Protected path match:', isProtectedPath ? path : 'none');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    console.log('No session cookie found');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
