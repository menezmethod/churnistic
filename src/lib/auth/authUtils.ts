import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

export interface Session {
  uid: string;
  email: string | null;
}

export interface AuthContext {
  session: Session | null;
}

export async function createAuthContext(req: NextRequest): Promise<AuthContext> {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return { session: null };
    }

    const decodedToken = await getAuth().verifySessionCookie(sessionCookie);

    return {
      session: {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    // Return null session for any auth errors
    return { session: null };
  }
}
