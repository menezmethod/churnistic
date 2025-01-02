import { DecodedIdToken } from 'firebase-admin/auth';

import { getAdminAuth } from '@/lib/firebase/admin-app';

export interface SessionData extends DecodedIdToken {
  name?: string;
  picture?: string;
  role?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
  lastActivity?: number;
}

export async function verifySession(sessionCookie: string): Promise<SessionData | null> {
  try {
    console.log('Verifying session cookie...');
    const auth = getAdminAuth();
    console.log('Firebase Admin Auth obtained');

    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    let decodedToken: DecodedIdToken;

    if (useEmulators) {
      console.log('🔧 Using Firebase Emulators for session verification');
      try {
        const tokenData = JSON.parse(Buffer.from(sessionCookie.split('.')[1], 'base64').toString());
        decodedToken = {
          ...tokenData,
          uid: tokenData.user_id || tokenData.sub,
          email: tokenData.email,
          email_verified: tokenData.email_verified || false,
          auth_time: tokenData.auth_time || Math.floor(Date.now() / 1000),
          iat: tokenData.iat || Math.floor(Date.now() / 1000),
          exp: tokenData.exp || Math.floor(Date.now() / 1000) + 3600,
          firebase: tokenData.firebase || { sign_in_provider: 'custom', identities: {} },
        };
        console.log('Emulator token decoded:', decodedToken);
      } catch (error) {
        console.error('Failed to decode emulator token:', error);
        return null;
      }
    } else {
      try {
        decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        console.log('Session cookie verified for user:', decodedToken.uid);
      } catch (error) {
        console.error('Failed to verify session cookie:', error);
        return null;
      }
    }

    // In emulator mode, we skip user record verification and use token data directly
    if (useEmulators) {
      const sessionData: SessionData = {
        ...decodedToken,
        role: decodedToken.role || 'user',
        permissions: decodedToken.permissions || [],
        isSuperAdmin: decodedToken.isSuperAdmin || false,
        lastActivity: Date.now(),
      };
      console.log('Emulator session data:', sessionData);
      return sessionData;
    }

    // For production, get user record to ensure we have the latest claims
    try {
      const userRecord = await auth.getUser(decodedToken.uid);
      const sessionData: SessionData = {
        ...decodedToken,
        role: userRecord.customClaims?.role || decodedToken.role || 'user',
        permissions: userRecord.customClaims?.permissions || decodedToken.permissions || [],
        isSuperAdmin: userRecord.customClaims?.isSuperAdmin || decodedToken.isSuperAdmin || false,
        lastActivity: Date.now(),
      };
      console.log('Session data:', sessionData);
      return sessionData;
    } catch (error) {
      console.error('Failed to get user record:', error);
      // Fall back to decoded token data if user record fetch fails
      const sessionData: SessionData = {
        ...decodedToken,
        role: decodedToken.role || 'user',
        permissions: decodedToken.permissions || [],
        isSuperAdmin: decodedToken.isSuperAdmin || false,
        lastActivity: Date.now(),
      };
      console.log('Session data (fallback):', sessionData);
      return sessionData;
    }
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
