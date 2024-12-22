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
        // In emulator mode, verify the ID token directly
        decodedToken = await auth.verifyIdToken(sessionCookie);
        console.log(
          'Session token verified in emulator mode for user:',
          decodedToken.uid
        );
      } catch (error) {
        console.error('Failed to verify token in emulator mode:', error);
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

    const sessionData: SessionData = {
      ...decodedToken,
      role: decodedToken.role || 'user',
      permissions: decodedToken.permissions || [],
      isSuperAdmin: decodedToken.isSuperAdmin || false,
      lastActivity: Date.now(),
    };

    console.log('Session data:', sessionData);
    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
