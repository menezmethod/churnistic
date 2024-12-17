import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';

export interface Session {
  uid: string;
  email: string | null;
}

export interface AuthContext {
  session: Session | null;
}

export async function createAuthContext(req: NextRequest): Promise<AuthContext> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { session: null };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    return {
      session: {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
      },
    };
  } catch {
    // Return null session for any auth errors
    return { session: null };
  }
}
