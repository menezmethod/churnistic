import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { UserRole } from '@/lib/auth/types';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

// Paths that require admin/superadmin role
const adminPaths = ['/admin'];

export const config = {
  matcher: [
    // Match all paths except static files, images, and the verify endpoint
    '/((?!_next/static|_next/image|favicon.ico|api/auth/verify).*)',
    // Match RSC routes
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/users/:path*',
  ],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isRsc = request.headers.get('RSC') === '1';

  console.log('Middleware - Full request details:', {
    path,
    isRsc,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  const isAdminPath = adminPaths.some((prefix) => path.startsWith(prefix));
  console.log('Path analysis:', {
    path,
    isProtectedPath,
    isAdminPath,
    isRsc,
  });

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    console.log('No session cookie found, redirecting to signin');
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(signinUrl);
  }

  try {
    const protocol = request.nextUrl.protocol;
    const host = request.headers.get('host');
    const verifyUrl = `${protocol}//${host}/api/auth/verify`;

    // Forward necessary headers for verification
    const headers = new Headers({
      'Content-Type': 'application/json',
      Cookie: `session=${sessionCookie}`,
      'User-Agent': request.headers.get('user-agent') || '',
      'X-Requested-With': 'XMLHttpRequest',
    });

    // Verify session
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionCookie,
        requiredRole: isAdminPath ? UserRole.ADMIN : undefined,
      }),
      cache: 'no-store',
    });

    if (!verifyResponse.ok) {
      if (verifyResponse.status === 403) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Clear invalid session and redirect to signin
      const response = NextResponse.redirect(new URL('/auth/signin', request.url));
      response.cookies.delete('session');
      return response;
    }

    const { user } = await verifyResponse.json();

    // Add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-verified-user', JSON.stringify(user));

    // Handle RSC requests
    if (isRsc) {
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.headers.set('RSC', '1');
      return response;
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', {
      error: error instanceof Error ? error.message : String(error),
      path,
      isAdminPath,
      isRsc,
    });

    // Clear session and redirect to signin on error
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    response.cookies.delete('session');
    return response;
  }
}
