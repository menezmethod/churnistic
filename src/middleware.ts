import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { UserRole, ADMIN_ROLES } from '@/lib/auth/types';

// Paths that require authentication
const protectedPaths = [
  { path: '/dashboard', roles: [UserRole.USER] },
  { path: '/admin', roles: ADMIN_ROLES },
  { path: '/api/users', roles: ADMIN_ROLES },
];

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
  const pathConfig = protectedPaths.find(
    ({ path }) => normalizedPath === path || normalizedPath.startsWith(`${path}/`)
  );

  if (!pathConfig) {
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

        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // Add secure cookie with user data
        response.cookies.set(
          'x-auth-user',
          JSON.stringify({
            uid: decodedClaims.user_id || decodedClaims.sub,
            email: decodedClaims.email,
            role: decodedClaims.role || 'user',
            permissions: decodedClaims.permissions || [],
            emailVerified: decodedClaims.email_verified || false,
          }),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          }
        );

        return response;
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
        requiredRole:
          pathConfig.roles && pathConfig.roles.includes(UserRole.ADMIN)
            ? UserRole.ADMIN
            : undefined,
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

    // After successful verification
    if (pathConfig.roles && !pathConfig.roles.includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      'x-verified-user',
      JSON.stringify({
        id: user.uid,
        role: user.role,
        email: user.email,
        permissions: user.permissions,
      })
    );

    // Handle RSC requests
    if (isRsc) {
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.headers.set('RSC', '1');

      // Add secure cookie with user data
      response.cookies.set(
        'x-auth-user',
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          emailVerified: user.emailVerified,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        }
      );

      return response;
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add secure cookie with user data
    response.cookies.set(
      'x-auth-user',
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        emailVerified: user.emailVerified,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      }
    );

    return response;
  } catch (error) {
    console.error('Middleware error:', {
      error: error instanceof Error ? error.message : String(error),
      path,
      isAdminPath: pathConfig.roles && pathConfig.roles.includes(UserRole.ADMIN),
      isRsc,
    });

    // Clear session and redirect to signin on error
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    response.cookies.delete('session');
    return response;
  }
}
