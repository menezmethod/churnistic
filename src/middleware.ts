import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/admin', '/api/users'];

// Role-based permissions mapping
const rolePermissions = {
  admin: [
    'read:cards',
    'write:cards',
    'delete:cards',
    'read:bank_accounts',
    'write:bank_accounts',
    'delete:bank_accounts',
    'read:investments',
    'write:investments',
    'delete:investments',
    'view:basic_analytics',
    'view:advanced_analytics',
    'export:analytics',
    'view:risk_scores',
    'manage:risk_rules',
    'read:users',
    'write:users',
    'delete:users',
    'manage:settings',
    'view:logs',
    'use:api',
    'manage:api_keys',
    'manage:notifications',
    'receive:credit_card_alerts',
    'receive:bank_bonus_alerts',
    'receive:investment_alerts',
    'receive:risk_alerts',
  ],
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
  const sessionCookie = request.cookies.get('__session');
  console.log('Session cookie present:', !!sessionCookie);

  if (!sessionCookie) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log('Verifying session...');
  const response = await verifySession(request);
  console.log('Session verification response status:', response.status);

  if (!response.ok) {
    console.log('Session verification failed, redirecting to signin');
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  const session = await response.json();
  console.log('Session data:', session);

  // Get user's role-based permissions
  const userRolePermissions =
    rolePermissions[session.role as keyof typeof rolePermissions] || [];
  const userPermissions = [...(session.permissions || []), ...userRolePermissions];

  // For /admin paths, check if user has admin role
  if (path.startsWith('/admin') && session.role !== 'admin') {
    console.log('Access denied - not an admin');
    return new NextResponse('Access denied', { status: 403 });
  }

  // For /api/users path, check if user has required permissions
  if (path === '/api/users' && !userPermissions.includes('read:users')) {
    console.log('Access denied - missing read:users permission');
    return new NextResponse('Access denied', { status: 403 });
  }

  // For /dashboard path, check if user has required permissions
  if (path === '/dashboard') {
    const requiredPermissions = ['view:basic_analytics'];
    const hasRequiredPermissions = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );

    console.log('Permission check:', {
      userPermissions,
      requiredPermissions,
      hasRequiredPermissions,
    });

    if (!hasRequiredPermissions) {
      console.log('Access denied - missing required permissions');
      return new NextResponse('Access denied', { status: 403 });
    }
  }

  console.log('Access granted');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
