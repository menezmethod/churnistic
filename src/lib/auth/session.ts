import { DecodedIdToken } from 'firebase-admin/auth';

import { getAdminAuth } from '@/lib/firebase/admin';

export interface SessionClaims extends DecodedIdToken {
  role?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export async function verifySession(
  sessionCookie: string
): Promise<SessionClaims | null> {
  try {
    console.log('Verifying session with cookie:', sessionCookie ? 'present' : 'missing');
    console.log('Environment:', {
      isEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
      nodeEnv: process.env.NODE_ENV,
    });

    // In emulator mode, we can decode and trust the session cookie without verification
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      console.log('Using emulator mode session verification');
      const [, payload] = sessionCookie.split('.');
      if (!payload) {
        console.log('No payload in session cookie');
        return null;
      }

      try {
        const decodedClaims = JSON.parse(
          Buffer.from(payload, 'base64').toString()
        ) as SessionClaims;
        console.log('Decoded claims:', {
          ...decodedClaims,
          email: decodedClaims.email ? 'present' : 'missing',
        });
        return {
          ...decodedClaims,
          role: decodedClaims.role?.toLowerCase(),
          isAdmin: decodedClaims.role?.toLowerCase() === 'admin',
          isSuperAdmin:
            decodedClaims.role?.toLowerCase() === 'superadmin' ||
            decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
        };
      } catch (e) {
        console.error('Failed to decode session cookie:', e);
        return null;
      }
    }

    // In production, verify the session cookie
    console.log('Using production session verification');
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    console.log('Verified claims:', {
      ...decodedClaims,
      email: decodedClaims.email ? 'present' : 'missing',
    });
    return {
      ...decodedClaims,
      role: decodedClaims.role?.toLowerCase(),
      isAdmin: decodedClaims.role?.toLowerCase() === 'admin',
      isSuperAdmin:
        decodedClaims.role?.toLowerCase() === 'superadmin' ||
        decodedClaims.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
