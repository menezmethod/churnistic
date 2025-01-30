import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

// Paths that require admin/superadmin role
const adminPaths = ['/admin'];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/verify).*)'],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware - Processing request for path:', path);

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  const isAdminPath = adminPaths.some((prefix) => path.startsWith(prefix));
  console.log('Protected path match:', isProtectedPath ? path : 'none');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    console.log('No session cookie found');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    // Get the protocol and host from the request URL
    const protocol = request.nextUrl.protocol;
    const host = request.headers.get('host');

    // Construct the absolute URL for the verify endpoint
    const verifyUrl = `${protocol}//${host}/api/auth/verify`;
    console.log('Debug - Full request details:', {
      url: verifyUrl,
      sessionCookiePresent: !!sessionCookie,
      sessionCookieLength: sessionCookie?.length,
      host,
      protocol,
      path,
      isAdminPath,
      cookies: request.cookies.getAll(),
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
    });

    // Verify session using the API route
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionCookie,
        requiredRole: isAdminPath ? 'admin' : undefined,
      }),
      credentials: 'include',
    });

    console.log('Verify response status:', verifyResponse.status);

    if (!verifyResponse.ok) {
      const responseData = await verifyResponse.json();
      console.log('Session verification failed:', {
        status: verifyResponse.status,
        error: responseData.error,
        path,
        isAdminPath,
      });

      if (verifyResponse.status === 403) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { user } = await verifyResponse.json();
    console.log('Session verified for user:', user?.email);

    // Clone the request headers and add the verified user info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-verified-user', JSON.stringify(user));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error('Error in middleware - Full details:', {
      errorType: error instanceof Error ? 'Error' : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path,
      isAdminPath,
      sessionCookiePresent: !!sessionCookie,
    });

    // Try to parse the response if it's a fetch error
    if (error instanceof Error && error.message.includes('JSON')) {
      console.log('Possible HTML response received instead of JSON');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
