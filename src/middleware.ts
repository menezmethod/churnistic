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
    signinUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signinUrl);
  }

  try {
    // Get the protocol and host from the request URL
    const protocol = request.nextUrl.protocol;
    const host = request.headers.get('host');

    // Construct the absolute URL for the verify endpoint
    const verifyUrl = `${protocol}//${host}/api/auth/verify`;
    console.log('Verify request details:', {
      url: verifyUrl,
      sessionCookiePresent: !!sessionCookie,
      sessionCookieLength: sessionCookie?.length,
      host,
      protocol,
      path,
      isAdminPath,
      cookies: request.cookies.getAll(),
      isRsc,
    });

    // Forward all cookies and headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      Cookie: request.headers.get('cookie') || '',
      // Forward other important headers
      'User-Agent': request.headers.get('user-agent') || '',
      Accept: request.headers.get('accept') || '',
      'Accept-Language': request.headers.get('accept-language') || '',
      'X-Requested-With': request.headers.get('x-requested-with') || '',
      Origin: request.headers.get('origin') || request.url,
    });

    // Verify session using the API route
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionCookie,
        requiredRole: isAdminPath ? UserRole.ADMIN : undefined,
      }),
      credentials: 'include',
    });

    console.log('Verify response:', {
      status: verifyResponse.status,
      ok: verifyResponse.ok,
      path,
      isAdminPath,
      isRsc,
    });

    if (!verifyResponse.ok) {
      const responseData = await verifyResponse.json();
      console.log('Session verification failed:', {
        status: verifyResponse.status,
        error: responseData.error,
        path,
        isAdminPath,
        isRsc,
      });

      if (verifyResponse.status === 403) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      const signinUrl = new URL('/auth/signin', request.url);
      signinUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signinUrl);
    }

    const { user } = await verifyResponse.json();
    console.log('Session verified for user:', {
      email: user?.email,
      path,
      isAdminPath,
      isRsc,
    });

    // Clone the request headers and add the verified user info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-verified-user', JSON.stringify(user));

    // For RSC requests, we need to handle them differently
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
      errorType: error instanceof Error ? 'Error' : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path,
      isAdminPath,
      isRsc,
      sessionCookiePresent: !!sessionCookie,
    });

    // Try to parse the response if it's a fetch error
    if (error instanceof Error && error.message.includes('JSON')) {
      console.log('Possible HTML response received instead of JSON');
      const signinUrl = new URL('/auth/signin', request.url);
      signinUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signinUrl);
    }

    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signinUrl);
  }
}
