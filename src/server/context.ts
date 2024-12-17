import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/db';
import { createAuthContext } from '@/lib/auth/authUtils';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface CreateContextOptions {
  session: DecodedIdToken | null;
  prisma: typeof prisma;
}

export async function createContext(req: NextRequest): Promise<CreateContextOptions> {
  try {
    const authContext = await createAuthContext(req);
    return {
      session: authContext.session ? ({
        uid: authContext.session.uid,
        email: authContext.session.email,
      } as DecodedIdToken) : null,
      prisma,
    };
  } catch {
    // Return null session for any auth errors
    return {
      session: null,
      prisma,
    };
  }
}
