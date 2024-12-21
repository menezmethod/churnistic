import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/auth/types';

type RouteConfig = {
  role?: UserRole;
  permissions?: Permission[];
};

// Define protected routes with their required roles/permissions
const protectedRoutes: Record<string, RouteConfig> = {
  '/admin': {
    role: UserRole.ADMIN,
  },
  '/api/admin': {
    role: UserRole.ADMIN,
  },
  '/cards': {
    permissions: [Permission.READ_CARDS],
  },
  '/dashboard': {
    permissions: [Permission.VIEW_BASIC_ANALYTICS],
  },
  '/settings': {
    permissions: [Permission.MANAGE_SETTINGS],
  },
};

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Check if path is protected
  const protectedPath = Object.keys(protectedRoutes).find((route) =>
    path.startsWith(route)
  );

  if (!protectedPath) {
    return NextResponse.next();
  }

  // Get the session cookie
  const session = request.cookies.get('__session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    // Verify the session by making a request to our API
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        Cookie: `__session=${session}`,
      },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const data = await response.json();
    const userRole = data.role as UserRole;
    const isSuperAdmin = data.isSuperAdmin === true;
    const routeConfig = protectedRoutes[protectedPath];

    // Super admins have access to all routes
    if (isSuperAdmin) {
      return NextResponse.next();
    }

    // Check role-based access
    if (routeConfig.role && userRole !== routeConfig.role && userRole !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Check permission-based access
    if (routeConfig.permissions) {
      const userPermissions = ROLE_PERMISSIONS[userRole];
      const hasRequiredPermissions = routeConfig.permissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

// Specify which paths should trigger the middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/cards/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
  ],
};
