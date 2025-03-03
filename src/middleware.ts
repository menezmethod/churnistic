import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Paths that ALWAYS require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/settings',
  '/admin',
  '/track',
  '/api/users',
  '/api/opportunities/import',
  '/api/opportunities/staged',
  '/api/opportunities/approve',
  '/api/opportunities/reject',
  '/api/opportunities/reset',
] as const;

// Public API endpoints and paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/opportunities/public-stats',
  '/api/opportunities',
  '/api/opportunities/[id]',
  '/api/opportunities/stats',
  '/opportunities',
  '/opportunities/[id]',
  '/api/auth/verify-session',
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/error',
  '/auth/test',
  '/unauthorized',
] as const;

// Admin-only paths
const ADMIN_PATHS = [
  '/admin',
  '/api/users',
  '/api/opportunities/import',
  '/api/opportunities/reset',
] as const;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|assets/).*)',
  ],
};

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware] Processing request for path: ${pathname}`);

  try {
    // Create Supabase client for auth checks - with improved error handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookie = request.cookies.get(name)?.value;
            console.log(`[Middleware] Getting cookie: ${name}, exists: ${!!cookie}`);
            return cookie;
          },
          set: (name: string, value: string, options: CookieOptions) => {
            console.log(`[Middleware] Setting cookie: ${name}`);
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove: (name: string, options: CookieOptions) => {
            console.log(`[Middleware] Removing cookie: ${name}`);
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Get user directly for security
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log(`[Middleware] Session state: ${!!user}, User ID: ${user?.id || 'none'}`);

    // Check if the path is public
    const isPublicPath = PUBLIC_PATHS.some(
      (path) =>
        pathname.startsWith(path) ||
        (path.includes('[id]') && pathname.match(path.replace('[id]', '\\d+')))
    );
    console.log(`[Middleware] Path ${pathname} is public: ${isPublicPath}`);

    if (isPublicPath) {
      if (user && pathname.startsWith('/auth/')) {
        console.log(
          '[Middleware] Authenticated user accessing auth page, redirecting to dashboard'
        );
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // Check if the path requires authentication
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    console.log(`[Middleware] Path ${pathname} is protected: ${isProtectedPath}`);

    if (isProtectedPath && !user) {
      console.log(
        '[Middleware] Unauthenticated access to protected path, redirecting to signin'
      );
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if the path requires admin access
    const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));
    if (isAdminPath && user) {
      // Verify admin role
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin =
        userProfile?.role &&
        ['admin', 'super_admin'].includes(userProfile.role.toLowerCase());
      if (!isAdmin) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // API route protection
    if (pathname.startsWith('/api/')) {
      // Add CORS headers for API routes
      response = new NextResponse(response.body, {
        ...response,
        headers: {
          ...response.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });

      // Handle OPTIONS request for CORS
      if (request.method === 'OPTIONS') {
        return response;
      }

      // Verify API authentication if required
      const isProtectedApi = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
      if (isProtectedApi && !user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...response.headers,
          },
        });
      }

      // Verify admin access for admin APIs
      const isAdminApi = ADMIN_PATHS.some((path) => pathname.startsWith(path));
      if (isAdminApi && user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const isAdmin =
          userProfile?.role &&
          ['admin', 'super_admin'].includes(userProfile.role.toLowerCase());
        if (!isAdmin) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...response.headers,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('[Middleware] Error processing request:', error);
    // Continue the request even if there's an error in the middleware
  }

  return response;
}
