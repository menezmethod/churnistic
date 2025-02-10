import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

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

// Admin-only paths
const adminPaths = ['/admin', '/api/users'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session if it exists
  const response = await updateSession(request);

  // If accessing auth pages while logged in, redirect to dashboard
  if (pathname.startsWith('/auth') && request.cookies.get('sb-access-token')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing protected pages without auth, redirect to login
  if (
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/settings')) &&
    !request.cookies.get('sb-access-token')
  ) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin access for admin paths
  if (request.cookies.get('sb-access-token') && adminPaths.some((p) => pathname.startsWith(p))) {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['super_admin', 'admin']);

    if (!roles?.length) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
