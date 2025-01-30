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
    // In emulator mode, we can decode and trust the session cookie without verification
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      const [, payload] = sessionCookie.split('.');
      if (!payload) return null;

      try {
        const decodedClaims = JSON.parse(
          Buffer.from(payload, 'base64').toString()
        ) as SessionClaims;
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
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
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
