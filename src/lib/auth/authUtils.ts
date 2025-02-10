import { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

import { AuthError } from '../errors/auth';

export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Failed to verify ID token:', error);
    throw new AuthError('auth/invalid-id-token', 'Invalid ID token', error);
  }
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<DecodedIdToken> {
  try {
    const auth = getAdminAuth();
    return await auth.verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error('Failed to verify session cookie:', error);
    throw new AuthError('auth/invalid-session-cookie', 'Invalid session cookie', error);
  }
}

export async function createSessionCookie(
  idToken: string,
  expiresIn = 60 * 60 * 24 * 5 * 1000
) {
  try {
    const auth = getAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    (await cookies()).set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return sessionCookie;
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    throw new AuthError(
      'auth/session-cookie-error',
      'Failed to create session cookie',
      error
    );
  }
}

export async function clearSessionCookie() {
  (await cookies()).delete('session');
}

export async function createAuthContext(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return { session: null };
  }

  try {
    const decodedToken = await verifySessionCookie(sessionCookie);
    return { session: decodedToken };
  } catch {
    return { session: null };
  }
}
