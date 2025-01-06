import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

export interface Session {
  uid: string;
  email: string | null;
  role?: string;
  permissions?: string[];
}

export interface AuthContext {
  session: Session | null;
}

export async function createAuthContext(req: NextRequest): Promise<AuthContext> {
  try {
    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
    const sessionCookie = req.cookies.get('session')?.value;

    if (!sessionCookie) {
      console.log('No session cookie found');
      return { session: null };
    }

    if (useEmulators) {
      console.log('🔧 Using Firebase Emulators for auth context');
      try {
        // In emulator mode, parse the session cookie directly
        const tokenData = JSON.parse(
          Buffer.from(sessionCookie.split('.')[1], 'base64').toString()
        );

        return {
          session: {
            uid: tokenData.user_id || tokenData.sub,
            email: tokenData.email,
            role: tokenData.role || 'user',
            permissions: tokenData.permissions || [],
          },
        };
      } catch (error) {
        console.error('Failed to decode emulator session:', error);
        return { session: null };
      }
    }

    // In production, verify the session cookie properly
    try {
      const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
      console.log('Session verified for user:', decodedToken.uid);

      return {
        session: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role || 'user',
          permissions: decodedToken.permissions || [],
        },
      };
    } catch (error) {
      console.error('Failed to verify session cookie:', error);
      return { session: null };
    }
  } catch (error) {
    console.error('Auth context error:', error);
    return { session: null };
  }
}
