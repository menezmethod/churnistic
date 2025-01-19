import { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';

import { UserRole, Permission } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase/admin';

import { AUTH_ERRORS } from '../core/constants';

export interface SessionData extends DecodedIdToken {
  name?: string;
  picture?: string;
  role?: UserRole;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
  lastActivity?: number;
}

export async function verifySession(
  sessionCookie: string,
  options?: {
    requiredRole?: UserRole;
    requiredPermissions?: Permission[];
  }
): Promise<SessionData> {
  try {
    const auth = getAdminAuth();
    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    let decodedToken: DecodedIdToken;

    if (useEmulators) {
      try {
        // In emulator mode, parse the session cookie directly
        const tokenData = JSON.parse(
          Buffer.from(sessionCookie.split('.')[1], 'base64').toString()
        );

        // Construct a minimal decoded token for emulator mode
        decodedToken = {
          uid: tokenData.user_id || tokenData.sub,
          email: tokenData.email,
          email_verified: tokenData.email_verified || false,
          auth_time: tokenData.auth_time || Math.floor(Date.now() / 1000),
          iat: tokenData.iat || Math.floor(Date.now() / 1000),
          exp: tokenData.exp || Math.floor(Date.now() / 1000) + 3600,
          firebase: tokenData.firebase || { sign_in_provider: 'custom', identities: {} },
          role: tokenData.role || UserRole.CONTRIBUTOR,
          permissions: tokenData.permissions || [],
          isSuperAdmin: tokenData.email === 'menezfd@gmail.com',
          aud: tokenData.aud || 'churnistic',
          iss: tokenData.iss || 'https://session.firebase.google.com/churnistic',
          sub: tokenData.sub || tokenData.user_id,
        };
      } catch (error) {
        console.error('Failed to decode emulator token:', error);
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
      }
    } else {
      try {
        decodedToken = await auth.verifySessionCookie(sessionCookie);
      } catch (error) {
        console.error('Failed to verify session cookie:', error);
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
      }
    }

    // Enhance the session data with role information
    const sessionData: SessionData = {
      ...decodedToken,
      role: (decodedToken.role as UserRole) || UserRole.CONTRIBUTOR,
      permissions: (decodedToken.permissions as Permission[] | undefined) ?? [],
      isSuperAdmin: decodedToken.email === 'menezfd@gmail.com',
      lastActivity: Date.now(),
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
    };

    // Validate required role
    if (options?.requiredRole && sessionData.role !== options.requiredRole) {
      throw new Error(AUTH_ERRORS.UNAUTHORIZED);
    }

    // Validate required permissions
    if (options?.requiredPermissions) {
      const hasAllPermissions = options.requiredPermissions.every(
        (permission) => sessionData.permissions?.includes(permission) ?? false
      );
      if (!hasAllPermissions) {
        throw new Error(AUTH_ERRORS.MISSING_PERMISSIONS);
      }
    }

    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    throw error;
  }
}

export async function createSession(user: DecodedIdToken): Promise<string> {
  const auth = getAdminAuth();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    // Create the session cookie
    const sessionCookie = await auth.createSessionCookie(user.uid, { expiresIn });

    return sessionCookie;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
}

export async function revokeSession(uid: string): Promise<void> {
  const auth = getAdminAuth();

  try {
    await auth.revokeRefreshTokens(uid);
  } catch (error) {
    console.error('Failed to revoke session:', error);
    throw error;
  }
}

export async function getSession(req: NextRequest): Promise<{ email: string } | null> {
  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const session = await verifySession(sessionCookie);
    if (!session?.email) {
      return null;
    }
    return { email: session.email };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}
