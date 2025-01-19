import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { UserRole, Permission } from '@/lib/auth/core/types';
import { verifySession } from '@/lib/auth/services/session';
import { validateRouteAccess } from '@/lib/auth/utils/validation';

export async function authMiddleware(
  req: NextRequest,
  requiredRole?: UserRole,
  options?: { requiredPermissions?: Permission[] }
) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    const session = await verifySession(sessionCookie);
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Check role and permissions
    const validationError = validateRouteAccess(
      session.role,
      requiredRole || UserRole.USER,
      options?.requiredPermissions || []
    );

    if (validationError) {
      return NextResponse.redirect(new URL('/403', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}
