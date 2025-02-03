import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

import { type Session } from '@/types/session';

export interface AuthContext {
  session: Session | null;
}

export async function createAuthContext(req: NextRequest): Promise<AuthContext> {
  try {
    const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
    const sessionCookie = req.cookies.get('session')?.value;
    const authHeader = req.headers.get('authorization');

    // Try Authorization header first
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        // In emulator mode, accept the token without verification
        if (useEmulators) {
          console.log(
            '🔧 Using Firebase Emulators - accepting ID token without verification'
          );
          try {
            // Basic JWT decode without verification
            const [, payload] = idToken.split('.');
            const decodedToken = JSON.parse(Buffer.from(payload, 'base64').toString());
            return {
              session: {
                uid: decodedToken.user_id || decodedToken.sub,
                email: decodedToken.email || '',
                role: decodedToken.role || 'user',
                permissions: decodedToken.permissions || [],
              },
            };
          } catch (error) {
            console.error('Failed to decode emulator token:', error);
            throw error;
          }
        }

        // In production, verify the token properly
        const decodedToken = await getAuth().verifyIdToken(idToken);
        console.log('ID Token verified for user:', decodedToken.uid);
        return {
          session: {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: decodedToken.role || 'user',
            permissions: decodedToken.permissions || [],
          },
        };
      } catch (error) {
        console.error('Failed to verify ID token:', error);
        // Fall through to try session cookie
      }
    }

    // Then try session cookie
    if (!sessionCookie) {
      console.log('No session cookie found');
      return { session: null };
    }

    if (useEmulators) {
      console.log('🔧 Using Firebase Emulators for session cookie');
      try {
        // In emulator mode, accept the session cookie without verification
        let tokenData;
        try {
          // Try parsing as JSON first (emulator format)
          tokenData = JSON.parse(sessionCookie);
        } catch {
          // If that fails, try decoding as JWT
          try {
            const [, payload] = sessionCookie.split('.');
            tokenData = JSON.parse(Buffer.from(payload, 'base64').toString());
          } catch (error) {
            console.error('Failed to decode emulator session:', error);
            throw error;
          }
        }

        return {
          session: {
            uid: tokenData.user_id || tokenData.sub || tokenData.uid,
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
          email: decodedToken.email || '',
          role: decodedToken.role || 'user',
          permissions: decodedToken.permissions || [],
        },
      };
    } catch (error) {
      console.error('Failed to verify session cookie:', error);
      return { session: null };
    }
  } catch (error) {
    console.error('Error in createAuthContext:', error);
    return { session: null };
  }
}
