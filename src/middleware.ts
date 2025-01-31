import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { UserRole } from '@/lib/auth/types';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/dashboard/:path*', // Handle all dashboard subroutes
  '/admin',
  '/admin/:path*', // Handle all admin subroutes
  '/api/users',
];

// Paths that require admin/superadmin role
const adminPaths = ['/admin'];

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/ (auth pages)
     * - api/auth/ (auth API endpoints)
     * - unauthorized (unauthorized page)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/auth/|unauthorized).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isRsc = request.headers.get('RSC') === '1';
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  console.log('Middleware - Full request details:', {
    path,
    isRsc,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    useEmulator,
  });

  // Normalize path by removing trailing slash
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((protectedPath) => {
    const normalizedProtected = protectedPath.endsWith('/')
      ? protectedPath.slice(0, -1)
      : protectedPath;

    return (
      normalizedPath === normalizedProtected ||
      normalizedPath.startsWith(`${normalizedProtected}/`)
    );
  });
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
    // In emulator mode, verify session differently
    if (useEmulator) {
      try {
        const [, payload] = sessionCookie.split('.');
        if (!payload) {
          throw new Error('Invalid session token format');
        }
        const decodedClaims = JSON.parse(Buffer.from(payload, 'base64').toString());

        // Add user info to headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          'x-verified-user',
          JSON.stringify({
            uid: decodedClaims.user_id || decodedClaims.sub,
            email: decodedClaims.email,
            role: decodedClaims.role || 'user',
            permissions: decodedClaims.permissions || [],
          })
        );

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        console.error('Emulator session verification failed:', error);
        const response = NextResponse.redirect(new URL('/auth/signin', request.url));
        response.cookies.delete('session');
        return response;
      }
    }

    // Use origin instead of constructing protocol/host manually
    const verifyUrl = new URL('/api/auth/verify', request.nextUrl.origin).toString();

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
