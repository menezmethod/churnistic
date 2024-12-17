import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { prisma } from '@/lib/prisma/db';

export interface CreateContextOptions {
  session: DecodedIdToken | null;
  prisma: typeof prisma;
}

export async function createContext(req: NextRequest): Promise<CreateContextOptions> {
  try {
    const authContext = await createAuthContext(req);
    return {
      session: authContext.session
        ? ({
            uid: authContext.session.uid,
            email: authContext.session.email,
          } as DecodedIdToken)
        : null,
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
