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

    // Check if we're using emulators
    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
    let decodedToken;

    if (useEmulators) {
      console.log('🔧 Using Firebase Emulators for session verification');
      try {
        // In emulator mode, we trust the token and decode it without verification
        // This is safe because it's only for local development
        try {
          const tokenData = JSON.parse(
            Buffer.from(sessionCookie.split('.')[1], 'base64').toString()
          );
          decodedToken = {
            ...tokenData,
            uid: tokenData.user_id || tokenData.sub,
            email: tokenData.email,
          };
          console.log('Emulator token decoded:', decodedToken);

          // In emulator mode, we use the token data directly
          const sessionData: SessionData = {
            ...decodedToken,
            role: decodedToken.role || 'user',
            permissions: decodedToken.permissions || [],
            isSuperAdmin: decodedToken.isSuperAdmin || false,
            lastActivity: Date.now(),
          };

          console.log('Emulator session data:', sessionData);
          return sessionData;
        } catch (decodeError) {
          console.error('Failed to decode emulator token:', decodeError);
          return null;
        }
      } catch (error) {
        console.error('Failed to handle token in emulator mode:', error);
        return null;
      }
    } else {
      // In production mode, verify the session cookie
      try {
        decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        console.log('Session cookie verified for user:', decodedToken.uid);
      } catch (error) {
        console.error('Failed to verify session cookie:', error);
        return null;
      }
    }

    // Get user record to ensure we have the latest claims
    try {
      const userRecord = await auth.getUser(decodedToken.uid);
      const sessionData: SessionData = {
        ...decodedToken,
        role: userRecord.customClaims?.role || decodedToken.role || 'user',
        permissions:
          userRecord.customClaims?.permissions || decodedToken.permissions || [],
        isSuperAdmin:
          userRecord.customClaims?.isSuperAdmin || decodedToken.isSuperAdmin || false,
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
